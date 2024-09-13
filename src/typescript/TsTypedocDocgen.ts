import { TsProject } from './TsProject';

/**
  Adds a simple Typescript documentation generator
 */
export class TsTypedocDocgen {
  constructor(project: TsProject) {
    project.addDevDeps('typedoc');

    const docgen = project.addTask('docgen', {
      description: `Generate TypeScript API reference ${project.docsDirectory}`,
      exec: `typedoc ${project.srcdir} --disableSources --out ${project.docsDirectory}`,
    });

    // spawn after a successful compile
    project.postCompileTask.spawn(docgen);
  }
}
