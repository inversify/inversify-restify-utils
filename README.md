# inversify-restify-utils

[![Join the chat at https://gitter.im/inversify/InversifyJS](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/inversify/InversifyJS?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://secure.travis-ci.org/inversify/inversify-restify-utils.svg?branch=master)](https://travis-ci.org/inversify/inversify-restify-utils)
[![Test Coverage](https://codeclimate.com/github/inversify/inversify-restify-utils/badges/coverage.svg)](https://codeclimate.com/github/inversify/inversify-restify-utils/coverage)
[![npm version](https://badge.fury.io/js/inversify-restify-utils.svg)](http://badge.fury.io/js/inversify-restify-utils)
[![Dependencies](https://david-dm.org/inversify/inversify-restify-utils.svg)](https://david-dm.org/inversify/inversify-restify-utils#info=dependencies)
[![img](https://david-dm.org/inversify/inversify-restify-utils/dev-status.svg)](https://david-dm.org/inversify/inversify-restify-utils/#info=devDependencies)
[![img](https://david-dm.org/inversify/inversify-restify-utils/peer-status.svg)](https://david-dm.org/inversify/inversify-restify-utils/#info=peerDependenciess)
[![Known Vulnerabilities](https://snyk.io/test/github/inversify/inversify-restify-utils/badge.svg)](https://snyk.io/test/github/inversify/inversify-restify-utils)

[![NPM](https://nodei.co/npm/inversify-restify-utils.png?downloads=true&downloadRank=true)](https://nodei.co/npm/inversify-restify-utils/)
[![NPM](https://nodei.co/npm-dl/inversify-restify-utils.png?months=9&height=3)](https://nodei.co/npm/inversify-restify-utils/)

Some utilities for the development of restify application with Inversify.

## The Basics

### Step 1: Decorate your controllers
To use a class as a "controller" for your restify app, simply add the `@Controller` decorator to the class. Similarly, decorate methods of the class to serve as request handlers. 
The following example will declare a controller that responds to `GET /foo'.

```ts
import * as restify from 'restify';
import { Controller, Get } from 'inversify-restify-utils';
import { injectable, inject } from 'inversify';

@Controller('/foo')
@injectable()
export class FooController implements Controller {
    
    constructor( @inject('FooService') private fooService: FooService ) {}
    
    @Get('/')
    private index(req: restify.Request): string {
        return this.fooService.get(req.query.id);
    }
}
```

### Step 2: Configure kernel and server
Configure the inversify kernel in your composition root as usual.

Then, pass the kernel to the InversifyRestifyServer constructor. This will allow it to register all controllers and their dependencies from your kernel and attach them to the restify app.
Then just call server.build() to prepare your app.

In order for the InversifyRestifyServer to find your controllers, you must bind them to the `TYPE.Controller` service identifier and tag the binding with the controller's name.
The `Controller` interface exported by inversify-restify-utils is empty and solely for convenience, so feel free to implement your own if you want.

```ts
import { Kernel } from 'inversify';
import { InversifyRestifyServer, TYPE } from 'inversify-restify-utils';

// set up kernel
let kernel = new Kernel();

// note that you *must* bind your controllers to Controller 
kernel.bind<Controller>(TYPE.Controller).to(FooController).whenTargetNamed('FooController');
kernel.bind<FooService>('FooService').to(FooService);

// create server
let server = new InversifyRestifyServer(kernel);

let app = server.build();
app.listen(3000);
```

## InversifyRestifyServer
A wrapper for a restify Application.

### `.setConfig(configFn)`
Optional - exposes the restify application object for convenient loading of server-level middleware.

```ts
import * as morgan from 'morgan';
// ...
let server = new InversifyRestifyServer(kernel);
server.setConfig((app) => {
    var logger = morgan('combined')
    app.use(logger);
});
```

### `.build()`
Attaches all registered controllers and middleware to the restify application. Returns the application instance.

```ts
// ...
let server = new InversifyRestifyServer(kernel);
server
    .setConfig(configFn)
    .build()
    .listen(3000, 'localhost', callback);
```

## Decorators

### `@Controller(path, [middleware, ...])`

Registers the decorated class as a controller with a root path, and optionally registers any global middleware for this controller.

### `@Method(method, path, [middleware, ...])`

Registers the decorated controller method as a request handler for a particular path and method, where the method name is a valid restify routing method.

### `@SHORTCUT(path, [middleware, ...])`

Shortcut decorators which are simply wrappers for `@Method`. Right now these include `@Get`, `@Post`, `@Put`, `@Patch`, `@Head`, `@Delete`, and `@Options`. For anything more obscure, use `@Method` (Or make a PR :smile:).
