import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as github from '@actions/github';
import {readFile} from 'fs/promises';
import path from 'path';
import {OpviousClient} from 'opvious';

async function main(): Promise<void> {
  const client = OpviousClient.create({
    authorization: core.getInput('authorization', {required: true}),
    apiEndpoint: core.getInput('api-endpoint') || undefined,
    hubEndpoint: core.getInput('hub-endpoint') || undefined,
  });
  const dryRun = core.getBooleanInput('dry-run');

  const srcGlob = core.getInput('sources', {required: true});
  const globber = await glob.create(srcGlob);

  for await (const srcPath of globber.globGenerator()) {
    console.log(`Processing ${srcPath}...`);
    const src = await readFile(srcPath, 'utf8');
    const {name} = path.parse(srcPath);
    const defs = await client.extractDefinitions(src);
    if (dryRun) {
      await client.validateDefinitions(defs);
      console.log(`Validated ${srcPath}.`);
    } else {
      const spec = await client.registerSpecification({
        formulationName: name,
        definitions: defs,
        description: src,
      });
      console.log(`Registered ${srcPath}. [revno=${spec.revno}]`);
      core.setOutput(name + '-revno', spec.revno);
      core.setOutput(name + '-url', client.specificationUrl(name, spec.revno));
    }
  }
}

if (module == require.main) {
  main().catch((err) => {
    core.setFailed(err);
  });
}
