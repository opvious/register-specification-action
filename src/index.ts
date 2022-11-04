import * as core from '@actions/core';
import * as github from '@actions/github';
import {readFile} from 'fs/promises';
import {OpviousClient} from 'opvious';

async function main(): Promise<void> {
  const client = OpviousClient.create({
    authorization: core.getInput('authorization', {required: true}),
    apiEndpoint: core.getInput('api-endpoint') || undefined,
    hubEndpoint: core.getInput('hub-endpoint') || undefined,
  });

  const formulation = core.getInput(
    'formulation-name',
    {required: true, trimWhitespace: true}
  );

  const srcPath = core.getInput('source', {required: true});
  const src = await readFile(srcPath, 'utf8');
  const defs = await client.extractDefinitions(src);
  const spec = await client.registerSpecification({
    formulationName: formulation,
    definitions: defs,
    description: src,
  });
  core.setOutput('revno', spec.revno);
  core.setOutput('url', client.specificationUrl(formulation, spec.revno));
}

if (module == require.main) {
  main().catch((err) => {
    core.setFailed(err);
  });
}
