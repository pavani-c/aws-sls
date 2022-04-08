'use strict';

const _ = require("lodash");

class ApiGatewayAuthExtension {

  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.hooks = {
      'package:compileEvents': this._compileEvents.bind(this)
    };
  }

  normalizePathPart(path) {
    return _.upperFirst(
      _.capitalize(path)
        .replace(/-/g, 'Dash')
        .replace(/\{(.*)\}/g, '$1Var')
        .replace(/[^0-9A-Za-z]/g, '')
    );
  }
  normalizeName(name) {
    return `${_.upperFirst(name)}`;
  }

  _compileEvents() {

    const tmp = this.serverless.service.provider.compiledCloudFormationTemplate;
    const resources = tmp.Resources;
    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const functionObject = this.serverless.service.functions[functionName];

      functionObject.events.forEach(event => {
        let httpEvent = event.http;
        if (typeof httpEvent === 'string') {
          const evParts = httpEvent.split(' ');
          httpEvent = {
            path: evParts[1],
            method: evParts[0],
            authorizer: {
              type: 'AWS_IAM'
            }
          }
        }
        if (
          !httpEvent ||
          !httpEvent.authorizer ||
          httpEvent.authorizer.type !== 'AWS_IAM' ||
          httpEvent.invokeWithCallerCredentials === false
        ) {
          return;
        }


        let path = httpEvent.path;
        let method = httpEvent.method;

        const resourcesArray = path.split('/');
        const normalizedResourceName = resourcesArray.map(this.normalizePathPart).join('');
        const normalizedMethod = this.normalizeName(method);
        const methodName = `ApiGatewayMethod${normalizedResourceName}${normalizedMethod}`;

        if(!resources[methodName]){
          this.serverless.cli.log(Object.keys(resources).sort().join("\n"))
          throw new this.serverless.classes
            .Error("Invalid normalized name: " + methodName + ".")
        }

        resources[methodName].Properties.Integration.Credentials = httpEvent.authorizer.credentials || 'arn:aws:iam::*:client/*';
        if (typeof event.http === 'string') {
          resources[methodName].Properties.AuthorizationType = 'AWS_IAM';
        }
      });
    });
  }

}

module.exports = ApiGatewayAuthExtension;