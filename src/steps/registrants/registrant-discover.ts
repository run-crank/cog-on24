import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class DiscoverRegistrant extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on an ON24 registrant';
  protected stepExpression: string = 'discover fields on ON24 registrant (?<email>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['discover'];
  protected targetObject: string = 'Registrant';
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
    let apiRes: any;

    try {
      apiRes = await this.client.getEventRegistrantByEmail(eventId, email);
    } catch (e) {
      return this.error('There was a problem connecting to ON24: %s', [e.toString()]);
    }

    try {
      if (apiRes.registrants.length === 0) {
        return this.fail('No registrant found for event %d and email %s', [eventId, email]);
      }

      const registrant = apiRes.registrants[0];
      const records = this.createRecords(registrant, stepData['__stepOrder']);

      return this.pass('Successfully discovered fields on registrant', [], records);

    } catch (e) {
      return this.error('There was an error checking the registrant: %s', [e.message]);
    }
  }

  public createRecords(registrant, stepOrder = 1): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('discoverRegistrant', 'Discovered Registrant', registrant));
    // Ordered Record
    records.push(this.keyValue(`discoverRegistrant.${stepOrder}`, `Discovered Registrant from Step ${stepOrder}`, registrant));
    return records;
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { DiscoverRegistrant as Step };
