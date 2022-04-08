'use strict';

const build = require('./lib/build');

class ServerlessArtifacts {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    Object.assign(
      this,
      build
    );
    this.commands = {
      artifacts: {
        usage: 'Helps you start your first Serverless plugin',
        lifecycleEvents: [
          'validate',
          'build'
        ],
        options: {
          function: {
            usage: 'Name of the function',
            shortcut: 'f',
            required: false
          },
          config: {
            usage: 'Name of the serverless file',
            shortcut: 'c',
            required: false
          },
          stage: {
            usage: 'Specify the stage you want to deploy to. (e.g. "--stage prod")',
            shortcut: 's',
            default: 'dev',
            required: false
          },
          dir: {
            usage: 'Specify build directory name. (e.g. "--dir artifacts")',
            shortcut: 'd',
            default: 'artifacts',
            required: false
          }
        },
      },
    };

    this.hooks = {
      'artifacts:validate': this.validate.bind(this),
      'before:artifacts:build': this.beforeBuild.bind(this),
      'artifacts:build': this.buildArtifacts.bind(this),
      'after:artifacts:build': this.afterBuild.bind(this),
      'before:package:createDeploymentArtifacts': this.beforeCreateDeploymentArtifacts.bind(this),
      'before:package:function:package': this.beforePackage.bind(this)
    };
  }

  beforePackage() {
    const fnObj = this.serverless.service.getFunction(this.options.function);
    fnObj.package = fnObj.package || {};
    fnObj.package.include = this.getFunctionDependencies(fnObj, this.serverless.config.servicePath);
  }
  beforeCreateDeploymentArtifacts() {
    this.serverless.service.getAllFunctions().map(functionName => {
      this.serverless.cli.log('Adding dependencies for ' + functionName);
      const fnObj = this.serverless.service.getFunction(functionName);
      fnObj.package = fnObj.package || {};
      fnObj.package.include = this.getFunctionDependencies(fnObj, this.serverless.config.servicePath);
    });
  }

  beforeBuild() {
    this.serverless.cli.log('Build artifacts for stage ' + this.options.ArtifactsPlugin.stage);
  }

  buildArtifacts() {
    this.serverless.cli.log('Building artifacts started...');
    const options = this.options.ArtifactsPlugin;
    Object.keys(options.functions).forEach(fnName => {
      const fnDef = options.functions[fnName];
      this.buildArtifact(Object.assign({
        servicePath: options.servicePath,
        artifactsFolderName: options.artifactsFolderName,
        artifactName: fnName
      }, fnDef));
      this.serverless.cli.log('Artifacts ready for ' + fnName);
    })
  }

  afterBuild() {
    this.serverless.cli.log('cleaning up');
  }

  validate() {
    if(!this.serverless.service.package || !this.serverless.service.package.individually) {
      throw new this.serverless.classes
        .Error('ServerlessArtifacts plugin: required indivually flag set to true');
    }
    if(this.options.function && !this.serverless.service.functions[this.options.function]) {
      throw new this.serverless.classes
        .Error('Invalid function name: ' + this.options.function);
    }
    let functions;
    if(this.options.function) {
      functions = {[this.options.function] : this.serverless.service.functions[this.options.function]};
    } else {
      functions = this.serverless.service.functions;
    }
    this.options.ArtifactsPlugin = {
      stage: this.options.stage || this.commands.artifacts.options.stage.default,
      functions,
      servicePath: this.serverless.config.servicePath,
      artifactsFolderName: this.options.dir || this.commands.artifacts.options.dir.default
    }
  //  console.log(this.serverless.config)
  }
}

module.exports = ServerlessArtifacts;
