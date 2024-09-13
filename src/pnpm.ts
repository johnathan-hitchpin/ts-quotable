import * as path from 'path';
import { FileBase, IResolver, Project } from 'projen';
import { stringify } from 'yaml';

export interface PnpmWorkspaceVersionOptions {
  readonly cdk: string;
  readonly constructs: string;
  readonly projen: string;
  readonly vitest: string;
}
export interface PnpmWorkspaceOptions {
  readonly project: Project;
  readonly pinnedVersions: PnpmWorkspaceVersionOptions;
}

export class PnpmWorkspace extends FileBase {
  readonly #props: PnpmWorkspaceOptions;
  constructor(props: PnpmWorkspaceOptions) {
    super(props.project, 'pnpm-workspace.yaml', {});
    this.#props = props;
  }

  get versions(): PnpmWorkspaceVersionOptions {
    return this.#props.pinnedVersions;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override synthesizeContent(_: IResolver): string | undefined {
    const projectPaths: string[] = [];
    const spQueue: Project[] = [...this.#props.project.subprojects];
    while (spQueue.length > 0) {
      const project = spQueue.shift()!;
      const spPath = path.relative(this.#props.project.outdir, project.outdir);
      projectPaths.push(spPath);
      if (project.subprojects) {
        spQueue.push(...project.subprojects);
      }
    }
    return stringify({
      packages: projectPaths,
      catalog: {
        constructs: this.#props.pinnedVersions.constructs,
        'aws-cdk-lib': this.#props.pinnedVersions.cdk,
        projen: this.#props.pinnedVersions.projen,
        vitest: this.#props.pinnedVersions.vitest,
      },
    });
  }
}
