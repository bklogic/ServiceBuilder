# Development Notes

## Workspace Use Cases

### Register

- Register with an unsecured builder service for a workspace.
- Retry button on error.
- Input: builder service endpoint

### Connect

- Connect to a secured workspace. 
- Retry button on error.
- Input: workspace URL and access key created by workspace management and auth service

### Show Workspace

- Displace workspace detail.
- Refresh token button on success
- Register and connect buttons on no workspace connection.
- No access key or token be exposed.

### About

- Display builder versions

## Concepts

### Workfolder

Service Builder works in a local workfolder. 

### Workspace

### URI

- workfolder:  application/module/service
- workspace: workspace/application/module/service

## Project Setup

### Node modules

```sh
npm install -g yo generator-code
npm install -g @vscode/vsce
```

### Instruction

https://code.visualstudio.com/api/working-with-extensions/publishing-extension

### Packaging

```sh
vsce package
```

### Publishing

#### Manually

- Go to VSCode Marketplace  
    https://marketplace.visualstudio.com/items?itemName=BackLogic.servicebuilder

- 

## Release

## Build

Push to GibLab to build vsix file

## Test

Download vsix file and test tutorial examples.

## Publish To VS Code Marketplace

Complete ```publish``` step from GitLab.


