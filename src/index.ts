import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as github from '@actions/github';
import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"
import {readFile} from 'fs/promises';
import path from 'path';
import {OpviousClient} from 'opvious';
import YAML from 'yaml';

async function main(): Promise<void> {
  const client = OpviousClient.create({
    authorization: core.getInput('token', {required: true}),
    domain: core.getInput('domain') || undefined,
  });

  const dryRun = core.getBooleanInput('dry-run');
  const tagNames = parseTags();
  const runner = dryRun
    ? Runner.validatingOnly(client)
    : Runner.registering(client, tagNames);

  const sources = parseSources();
  if (typeof sources == 'string') {
    // One specification per globbed file
    const globber = await glob.create(sources);
    for await (const srcPath of globber.globGenerator()) {
      const src = await readFile(srcPath, 'utf8');
      const {name} = path.parse(srcPath);
      await runner.run({name, sources: [src], description: src});
    }
  } else {
    // Explicitly defined specifications
    for (const spec of sources) {
      const globber = await glob.create(spec.sources);
      const srcPaths = await globber.glob();
      const srcs = await Promise.all(srcPaths.map((p) => readFile(p, 'utf8')));
      await runner.run({
        name: spec.name,
        sources: srcs,
        description: spec.description,
      });
    }
  }
  if (runner.failures) {
    throw new Error(`Encountered ${runner.failures} failure(s).`);
  }
}

function parseTags(): ReadonlyArray<string> {
  const input = parseInput({name: 'tags', validate: validateTags});
  return input == null ? [] : typeof input == 'string' ? [input] : input;
}

function parseSources(): Sources {
  return parseInput({name: 'sources', validate: validateSources, required: true});
}

const ajv = new Ajv();

type Tags = string | ReadonlyArray<string>;

const tagsSchema: JSONSchemaType<Tags> = {
  oneOf: [
    {type: 'string'},
    {type: 'array', items: {type: 'string'}},
  ],
};

const validateTags = ajv.compile(tagsSchema);

type Sources = string | ReadonlyArray<Specification>;

interface Specification {
  readonly name: string;
  readonly sources: string;
  readonly description?: string;
}

const sourcesSchema: JSONSchemaType<Sources> = {
  oneOf: [
    {type: 'string'},
    {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          sources: {type: 'string'},
          description: {type: 'string', nullable: true},
        },
        required: ['name', 'sources'],
      },
    },
  ],
};

const validateSources = ajv.compile(sourcesSchema);

function parseInput<V>(args: {
  readonly name: string;
  readonly required: true;
  readonly validate: ValidateFunction<V>;
}): V;
function parseInput<V>(args: {
  readonly name: string;
  readonly required?: boolean;
  readonly validate: ValidateFunction<V>;
}): V | undefined;
function parseInput<V>(args: {
  readonly name: string;
  readonly required?: boolean;
  readonly validate: ValidateFunction<V>;
}): V | undefined {
  const {name, required, validate} = args;
  const str = core.getInput(name, {required});
  if (!str) {
    return undefined;
  }
  try {
    const val = YAML.parse(str);
    if (!validate(val)) {
      throw new Error(JSON.stringify(validate.errors));
    }
    return val;
  } catch (err: any) {
    throw new Error(`Invalid sources for '${name}': ${err.message}`);
  }
}

/** Generic specification processor. */
type Processor = (args: {
  readonly name: string;
  readonly sources: ReadonlyArray<string>;
  readonly description?: string;
}) => Promise<void>;

/** Processor runner which tracks global status. */
class Runner {
  failures = 0;
  private constructor(private readonly processor: Processor) {}

  static registering(
    client: OpviousClient,
    tagNames: ReadonlyArray<string>
  ): Runner {
    return new Runner(async (args) => {
      const {name, sources} = args;
      const description = args.description
        ? await readFile(args.description, 'utf8')
        : undefined;
      const spec = await client.registerSpecification({
        formulationName: name,
        sources,
        description,
        tagNames,
      });
      const url = client.specificationUrl(name, spec.revno);
      console.log(
        `Registered sources for '${name}': ${url} [revno=${spec.revno}]`
      );
    });
  }

  static validatingOnly(client: OpviousClient): Runner {
    return new Runner(async (args) => {
      const {name, sources} = args;
      const {errors} = await client.parseSources({sources});
      if (errors.length) {
        throw new Error(JSON.stringify(errors, null, 2));
      }
      console.log(`Validated sources for '${name}'.`);
    });
  }

  async run(args: Parameters<Processor>[0]): Promise<void> {
    try {
      await this.processor(args);
    } catch (err: any) {
      console.error(`Sources for '${args.name}' are invalid: ${err.message}`);
      this.failures++;
    }
  }
}

if (module == require.main) {
  main().catch((err) => {
    core.setFailed(err);
  });
}
