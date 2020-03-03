import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let on24ConstructorStub: any;
  let on24ClientStub: any;
  let metadata: Metadata;
  let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    on24ClientStub = {
      analytics: {
        listEventRegistrants: sinon.stub(),
      },
      registration: {
        createRegistrant: sinon.stub(),
        forgetRegistrant: sinon.stub(),
      }
    };
    on24ConstructorStub = sinon.stub();
    on24ConstructorStub.returns(on24ClientStub);
  });

  it('authenticates', () => {
    // Construct grpc metadata and assert the client was authenticated.
    const expectedCallArgs = {
      clientId: 123,
      tokenKey: 'some-token-key',
      tokenSecret: 'some-token-secret',
    };
    metadata = new Metadata();
    Object.keys(expectedCallArgs).forEach(key => {
      metadata.add(key, expectedCallArgs[key].toString());
    })

    // Assert that the underlying API client was authenticated correctly.
    clientWrapperUnderTest = new ClientWrapper(metadata, on24ConstructorStub);
    expect(on24ConstructorStub).to.have.been.calledWith(expectedCallArgs);
  });

  it('getEventRegistrantByEmail', () => {
    const expectedEventId = 123;
    const expectedEmail = 'test@example.com';
    clientWrapperUnderTest = new ClientWrapper(metadata, on24ConstructorStub);
    clientWrapperUnderTest.getEventRegistrantByEmail(expectedEventId, expectedEmail);

    expect(on24ClientStub.analytics.listEventRegistrants).to.have.been.calledWith(
      expectedEventId,
      { email: expectedEmail },
    );
  });

  it('createEventRegistrant', () => {
    const expectedEventId = 123;
    const expectedRegistrant = { email: 'test@example.com' };
    clientWrapperUnderTest = new ClientWrapper(metadata, on24ConstructorStub);
    clientWrapperUnderTest.createEventRegistrant(expectedEventId, expectedRegistrant);

    expect(on24ClientStub.registration.createRegistrant).to.have.been.calledWith(
      expectedEventId,
      expectedRegistrant,
    );
  });

  it('forgetEventRegistrantByEmail', () => {
    const expectedEventId = 123;
    const expectedEmail = 'test@example.com';
    clientWrapperUnderTest = new ClientWrapper(metadata, on24ConstructorStub);
    clientWrapperUnderTest.forgetEventRegistrantByEmail(expectedEventId, expectedEmail);

    expect(on24ClientStub.registration.forgetRegistrant).to.have.been.calledWith(
      expectedEmail,
      expectedEventId,
    );
  });

});
