"use strict";

const dependencyTree = require("dependency-tree");
const fs = require("fs-extra");
const path = require("path");

function getDependencies(fileName, servicePath) {
  const nodeModules = {};
  const projectDeps = {[fileName]: true};

  if(!fs.pathExistsSync(fileName)) {
    throw new this.serverless.classes
      .Error('Path not found: ' + fileName);
  }

  let packageDir = path.dirname(fileName);
  while(!fs.pathExistsSync(packageDir + '/' + 'package.json') && packageDir !== servicePath) {
    packageDir = path.dirname(packageDir);
  }
  let obj = {
    filename: fileName,
    directory: path.resolve(packageDir),
    filter: strPath => {
      const result = strPath.indexOf(servicePath) !== -1 && strPath.indexOf('aws-sdk') === -1 && strPath.substr(strPath.indexOf('node_modules') + 5).indexOf('node-modules') === -1;
      if(result && !fs.pathExistsSync(strPath)) {
        throw new this.serverless.classes
          .Error('Path not found: ' + strPath);
      }
      if (result) {
        if (strPath.indexOf('node_modules') !== -1) {
          let dirName = strPath.replace(servicePath + '/', '');
          dirName = dirName.match(/([\s\S]*node_modules\/[^\/]+)/)[1];
          nodeModules[dirName] = true;
        } else {
          projectDeps[strPath.replace(servicePath + '/', '')] = true;
        }
      }
      return result;
    },
    nonExistent: []
  };
  dependencyTree( obj );
  const deps = Object.keys(nodeModules);
  let result = [];
  deps.forEach(path => {
    getDepsFromPackageJson(path, result, packageDir)
  });
  result = result.filter(dep => {
    if(dep.substr((`${packageDir}/node_modules`).length).indexOf('node_modules') >= 0) {
      return false;
    }
    return true;
  });

  return {project: Object.keys(projectDeps), nodeModules: result}
}

function getDepsFromPackageJson(packagePath, refResult, rootPath) {
  refResult.push(packagePath);
  const packageConfig = require(path.resolve(packagePath + '/package.json'));
  const packageDeps = Object.keys(packageConfig.dependencies || {});
  let depPackagePath;
  packageDeps.forEach(depName => {
    if(fs.pathExistsSync(path.resolve(packagePath + '/node_modules/' + depName))) {
      depPackagePath = packagePath + '/node_modules/' + depName;
    } else {
      if(fs.pathExistsSync(path.resolve(rootPath + '/node_modules/' + depName))) {
        depPackagePath = rootPath + '/node_modules/' + depName
      }
    }
    if(depPackagePath && refResult.indexOf(depPackagePath) === -1) {
      getDepsFromPackageJson(depPackagePath, refResult, rootPath)
    }
  })
}

module.exports = {

  getFunctionDependencies(fnConfig, servicePath) {
    const fname = path.dirname(fnConfig.handler) + '/' + path.basename(fnConfig.handler).substr(0,path.basename(fnConfig.handler).indexOf('.')) +'.js';
    const arrDeps = getDependencies.call(this, fname, servicePath);
    let result = (fnConfig.package || {}).include || [];

    result = arrDeps.project.reduce((prev, dep) => {
      result.push(dep);
      return result;
    }, result);
    result = arrDeps.nodeModules.reduce((prev, dep) => {
      result.push(dep+'/**');
      return result;
    }, result);
    return result;
  },

  buildArtifact(fnConfig) {
    const fname = path.dirname(fnConfig.handler) + '/' + path.basename(fnConfig.handler).substr(0,path.basename(fnConfig.handler).indexOf('.')) +'.js'; //'api/activation-code/verify.js';
    const lambdaName = fnConfig.artifactName;
    const destDirName = fnConfig.artifactsFolderName;
    const servicePath = fnConfig.servicePath;

    const arrDeps = getDependencies.call(this, fname, servicePath);
    const projectDeps = arrDeps.project;
    const nodeModules = arrDeps.nodeModules;
    const destArtifactFolder = servicePath + '/' + destDirName +'/' + lambdaName;

    projectDeps.forEach(fileName => {
      const srcPath = path.resolve(servicePath + '/' + fileName);
      const destPath = destArtifactFolder+'/'+fileName;
      fs.copySync(srcPath, destPath);
    });

    nodeModules.forEach(folderName => {
      const srcPath = path.resolve(servicePath + '/'+folderName);
      const destPath = destArtifactFolder+'/'+folderName;
      fs.copySync(srcPath, destPath, { dereference: true });
    });
  }
}




