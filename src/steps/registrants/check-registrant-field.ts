import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

import { baseOperators } from './../../client/constants/operators';
import * as util from '@run-crank/utilities';

export class CheckRegistrantField extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on an ON24 registrant';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected stepExpression: string = 'the (?<field>.+) field on ON24 registrant (?<email>.+) for event (?<eventId>\\d+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)';
  protected stepHelp: string = 'This step attempts to find an event registrant for the given event ID and email, then checks the value of a specified registrant field.';
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Registrant's email address",
    help: 'This email address is used to find the ON24 registrant.',
  }, {
    field: 'eventId',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Event ID',
    help: 'This ID is used to find the ON24 registrant. Event IDs can be found in your ON24 event dashboard.',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, or be less than)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'registrant',
    type: RecordDefinition.Type.KEYVALUE,
    dynamicFields: true,
    fields: [{
      field: 'eventuserid',
      description: 'Event User ID',
      type: FieldDefinition.Type.NUMERIC,
    }, {
      field: 'createtimestamp',
      description: 'Registrant create date/time.',
      type: FieldDefinition.Type.DATETIME,
    }, {
      field: 'email',
      description: "Registrant's e-mail address",
      type: FieldDefinition.Type.EMAIL,
    }],
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    let apiRes: any;
    const stepData: any = step.getData().toJavaScript();
    const eventId: number = stepData.eventId;
    const email: string = stepData.email;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    const operator: string = stepData.operator.toLowerCase();
    let actualValue: any;

    // Search ON24 for registrant.
    try {
      apiRes = await this.client.getEventRegistrantByEmail(eventId, email);
    } catch (e) {
      return this.error('There was a problem connecting to ON24: %s', [e.toString()]);
    }

    try {
      if (apiRes.registrants.length === 0) {
        // If no results were found, return an error.
        return this.error('No registrant found for event %d and email %s', [eventId, email]);
      }

      const registrant = apiRes.registrants[0];
      const registrantRecord = this.keyValue('registrant', 'Registrant Record', registrant);
      actualValue = registrant[field] || null;

      // If the value of the field matches expectations, pass.
      if (this.compare(operator, actualValue, expectedValue)) {
        return this.pass(util.operatorSuccessMessages[operator], [field, expectedValue], [registrantRecord]);
      }

      // Otherwise, if the value of the field does not match expectations, fail.
      return this.fail(util.operatorFailMessages[operator], [field, expectedValue, actualValue], [registrantRecord]);
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s. Please provide one of: %s', [e.message, baseOperators]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation: %s', [e.message]);
    }
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { CheckRegistrantField as Step };
