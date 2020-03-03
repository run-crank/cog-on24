import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/registrants/create-registrant';

chai.use(sinonChai);

describe('CreateRegistrant', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let apiClientStub: any;

  beforeEach(() => {
    // An example of how you can stub/mock API client methods.
    apiClientStub = sinon.stub();
    apiClientStub.createEventRegistrant = sinon.stub();
    stepUnderTest = new Step(apiClientStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CreateRegistrant');
    expect(stepDef.getName()).to.equal('Create an ON24 registrant');
    expect(!!stepDef.getHelp()).to.equal(true);
    expect(stepDef.getExpression()).to.equal('create an ON24 registrant for event (?<eventId>\\d+)');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Event ID field
    const eventId: any = fields.filter(f => f.key === 'eventId')[0];
    expect(eventId.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(eventId.type).to.equal(FieldDefinition.Type.NUMERIC);

    // Registrant field
    const registrant: any = fields.filter(f => f.key === 'registrant')[0];
    expect(registrant.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(registrant.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should return expected step records', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const records: any[] = stepDef.getExpectedRecordsList().map((record: RecordDefinition) => {
      return record.toObject();
    });

    // Registrant record
    const registrant: any = records.filter(r => r.id === 'registrant')[0];
    expect(registrant.type).to.equal(RecordDefinition.Type.KEYVALUE);
    expect(registrant.mayHaveMoreFields).to.equal(true);

    // Registrant record eventuserid field
    const userId: any = registrant.guaranteedFieldsList.filter(f => f.key === 'eventuserid')[0];
    expect(userId.type).to.equal(FieldDefinition.Type.NUMERIC);

    // User record createtimestamp field
    const registrantCreatedAt: any = registrant.guaranteedFieldsList.filter(f => f.key === 'createtimestamp')[0];
    expect(registrantCreatedAt.type).to.equal(FieldDefinition.Type.DATETIME);

    // Registrant record email field
    const registrantEmail: any = registrant.guaranteedFieldsList.filter(f => f.key === 'email')[0];
    expect(registrantEmail.type).to.equal(FieldDefinition.Type.EMAIL);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const expectedRegistrant: any = {email: 'expected@example.com'};
    apiClientStub.createEventRegistrant.resolves(expectedRegistrant)

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      eventId: 123,
      registrant: expectedRegistrant,
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    expect(records[0].getId()).to.equal('registrant');
    expect(records[0].getKeyValue().toJavaScript()).to.deep.equal(expectedRegistrant);
  });

  it('should respond with error if API client throws error', async () => {
    // Stub a response that throws any exception.
    const expectedRegistrant: any = {email: 'expected@example.com'};
    apiClientStub.createEventRegistrant.throws();

    protoStep.setData(Struct.fromJavaScript({
      eventId: 123,
      registrant: expectedRegistrant,
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
