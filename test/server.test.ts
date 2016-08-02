// test libraries
import { expect } from "chai";
import * as sinon from "sinon";

// dependencies
import * as restify from "restify";
import { InversifyRestifyServer } from "../src/server";
import { Kernel, injectable } from "inversify";
import { TYPE } from "../src/constants";

describe("Unit Test: InversifyExpressServer", () => {

    it("should call the configFn before the errorConfigFn", (done) => {
        let middleware = function(req: restify.Request, res: restify.Response, next: restify.Next) { return; };
        let configFn = sinon.spy((app: restify.Server) => { app.use(middleware); });
        let errorConfigFn = sinon.spy((app: restify.Server) => { app.use(middleware); });
        let kernel = new Kernel();

        @injectable()
        class TestController {}

        kernel.bind(TYPE.Controller).to(TestController);
        let server = new InversifyRestifyServer(kernel);

        server.setConfig(configFn)
            .setErrorConfig(errorConfigFn);

        expect(configFn.called).to.be.false;
        expect(errorConfigFn.called).to.be.false;

        server.build();

        expect(configFn.calledOnce).to.be.true;
        expect(errorConfigFn.calledOnce).to.be.true;
        expect(configFn.calledBefore(errorConfigFn)).to.be.true;
        done();
    });
});
