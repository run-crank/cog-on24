import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse, RecordDefinition, StepRecord } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/registrants/check-registrant-field';

chai.use(sinonChai);

describe('CheckRegistrantField', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let apiClientStub: any;

  beforeEach(() => {
    // An example of how you can stub/mock API client methods.
    apiClientStub = sinon.stub();
    apiClientStub.getEventRegistrantByEmail = sinon.stub();
    stepUnderTest = new Step(apiClientStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CheckRegistrantField');
    expect(stepDef.getName()).to.equal('Check a field on an ON24 registrant');
    expect(!!stepDef.getHelp()).to.equal(true);
    expect(stepDef.getExpression()).to.equal('the (?<field>.+) field on ON24 registrant (?<email>.+) for event (?<eventId>\\d+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Field field
    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);

    // Event ID field
    const eventId: any = fields.filter(f => f.key === 'eventId')[0];
    expect(eventId.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(eventId.type).to.equal(FieldDefinition.Type.NUMERIC);

    // Email field
    const email: any = fields.filter(f => f.key === 'email')[0];
    expect(email.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(email.type).to.equal(FieldDefinition.Type.EMAIL);
    expect(!!email.help).to.equal(true);

    // Operator field
    const operator: any = fields.filter(f => f.key === 'operator')[0];
    expect(operator.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(operator.type).to.equal(FieldDefinition.Type.STRING);

    // Expected Value field
    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
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

  it('should convert true/false to Y/N before check', async () => {
    // Stub a response that matches expectations.
    const expectedRegistrant: any = {someField: 'N'};
    apiClientStub.getEventRegistrantByEmail.resolves({registrants: [expectedRegistrant]});

    // Set step data corresponding to expectations (note false instead of N).
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectedValue: false,
      email: 'anything@example.com',
      operator: 'be',
      eventId: 123,
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const expectedRegistrant: any = {someField: 'Expected Value'};
    apiClientStub.getEventRegistrantByEmail.resolves({registrants: [expectedRegistrant]})

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectedValue: expectedRegistrant.someField,
      email: 'anything@example.com',
      operator: 'be',
      eventId: 123,
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    expect(records[0].getId()).to.equal('registrant');
    expect(records[0].getKeyValue().toJavaScript()).to.deep.equal(expectedRegistrant);
  });

  it('should respond with fail if API client resolves unexpected data', async () => {
    // Stub a response that does not match expectations.
    const expectedRegistrant: any = {someField: 'Expected Value'};
    apiClientStub.getEventRegistrantByEmail.resolves({registrants: [expectedRegistrant]});

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectedValue: `Not ${expectedRegistrant.someField}`,
      email: 'anything@example.com',
      operator: 'be',
      eventId: 123,
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    expect(records[0].getId()).to.equal('registrant');
    expect(records[0].getKeyValue().toJavaScript()).to.deep.equal(expectedRegistrant);
  });

  it('should respond with fail if resolved registrant does not contain given field', async () => {
    // Stub a response with valid response, but no expected field.
    const expectedUser: any = {someField: 'Expected Value'};
    apiClientStub.getEventRegistrantByEmail.resolves({registrants: [expectedUser]});
    protoStep.setData(Struct.fromJavaScript({
      field: 'someOtherField',
      expectedValue: 'Any Value',
      email: 'anything@example.com',
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    const records: StepRecord[] = response.getRecordsList();
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    expect(records[0].getId()).to.equal('registrant');
    expect(records[0].getKeyValue().toJavaScript()).to.deep.equal(expectedUser);
  });

  it('should respond with error if API client resolves no results', async () => {
    // Stub a response with no results in the body.
    apiClientStub.getEventRegistrantByEmail.resolves({registrants: []});
    protoStep.setData(Struct.fromJavaScript({
      field: 'anyField',
      expectedValue: 'Any Value',
      email: 'anything@example.com',
      operator: 'be',
      eventId: 123,
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error if API client throws error', async () => {
    // Stub a response that throws any exception.
    apiClientStub.getEventRegistrantByEmail.throws();
    protoStep.setData(Struct.fromJavaScript({
      operator: 'be',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});