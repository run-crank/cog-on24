import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

import { baseOperators } from './../../client/constants/operators';
import * as util from '@run-crank/utilities';
import { isNullOrUndefined } from 'util';

export class CheckRegistrantField extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on an ON24 registrant';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected stepExpression: string = 'the (?<field>.+) field on ON24 registrant (?<email>.+) for event (?<eventId>\\d+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?';
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
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
    optionality: FieldDefinition.Optionality.OPTIONAL,
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
    const stepData: any = step.getData().toJavaScript();
    this.convertBooleanToOn24YesNo(stepData);

    const eventId: number = stepData.eventId;
    const email: string = stepData.email;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    const operator: string = stepData.operator.toLowerCase();
    let actualValue: any;
    let apiRes: any;

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

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
      const records = this.createRecords(registrant, stepData['__stepOrder']);
      actualValue = registrant[field] || null;

      const result = this.assert(operator, actualValue, expectedValue, field);

      // If the value of the field matches expectations, pass.
      // Otherwise, if the value of the field does not match expectations, fail.
      return result.valid ? this.pass(result.message, [], records)
        : this.fail(result.message, [], records);

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

  public createRecords(registrant, stepOrder = 1): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('registrant', 'Registrant Record', registrant));
    // Ordered Record
    records.push(this.keyValue(`registrant.${stepOrder}`, `Registrant Record from Step ${stepOrder}`, registrant));
    return records;
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { CheckRegistrantField as Step };
