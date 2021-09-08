# Service Builder

Building data access service, the new approach to relational data access.

## Features

Service Builder for building data access applications.

## Requirements

No dependency

## Extension Settings

No settings. Maybe Later.

## Known Issues

No issues found yet.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

## Publishing Extension

### Instruction  

https://code.visualstudio.com/api/working-with-extensions/publishing-extension

### Commands  

vsce package  
vsce publish  

## Service Deployment

### File Structure

```sh
workspace-folder/
    .deployment/
        my-app/
            application
            my-mod/
                module
                my-service/
                    service
                    tests.http
```

### Actions

#### Refresh

- refresh application list, on title bar  
    reload application list
- refresh application, on application bar  
    reload application structure
- refresh tests, on service bar  
    redload tests.http

#### Clean

- clean workspace, on title bar more menu
- clean application, on application bar context menu
