import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as github from '@actions/github';
import {readFile} from 'fs/promises';
import path from 'path';
import {OpviousClient} from 'opvious';

async function main(): Promise<void> {
  const client = OpviousClient.create({
    authorization: core.getInput('token', {required: true}),
    domain: core.getInput('domain') || undefined,
  });
  const dryRun = core.getBooleanInput('dry-run');
  const tags = commaSeparated(core.getInput('tags'));

  const srcGlob = core.getInput('sources', {required: true});
  const globber = await glob.create(srcGlob);

  let valid = true;
  for await (const srcPath of globber.globGenerator()) {
    console.log(`Processing ${srcPath}...`);
    const src = await readFile(srcPath, 'utf8');
    const {name} = path.parse(srcPath);
    if (dryRun) {
      const {errors} = await client.parseSources(src);
      if (errors.length) {
        valid = false;
        console.error(
          `Source ${srcPath} is invalid: ${JSON.stringify(errors, null, 2)}`
        );
      } else {
        console.log(`Source ${srcPath} is valid.`);
      }
    } else {
      const spec = await client.registerSpecification({
        formulationName: name,
        sources: [src],
        description: src,
        tagNames: tags,
      });
      const url = client.specificationUrl(name, spec.revno);
      console.log(`Registered ${srcPath}: ${url} [revno=${spec.revno}]`);
    }
  }
  if (!valid) {
    throw new Error('At least one source was invalid');
  }
}

function commaSeparated(arg: string): ReadonlyArray<string> {
  return arg.split(',').map(e => e.trim()).filter(e => e);
}

if (module == require.main) {
  main().catch((err) => {
    core.setFailed(err);
  });
}
