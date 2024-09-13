import { RootProject, TsModernProject } from './src';

const versions = {
  cdk: '2.150.0',
  constructs: '10.3.0',
  projen: '0.85.0',
  jsii: '~5.5.0',
  vitest: '2.0.5',
};
const root = new RootProject({
  name: '@ts-quotable/project',
  versions: versions,
});

new TsModernProject({
  parent: root,
  outdir: 'packages/tsq',
  name: 'ts-quotable',
  defaultReleaseBranch: 'main',
  deps: ['fast-glob'],
});

root.synth();
