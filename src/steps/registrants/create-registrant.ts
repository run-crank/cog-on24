import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CreateRegistrant extends BaseStep implements StepInterface {

  protected stepName: string = 'Create an ON24 registrant';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected stepExpression: string = 'create an ON24 registrant for event (?<eventId>\\d+)';
  protected stepHelp: string = 'This step attempts to create a registrant for the given event ID.';
  protected expectedFields: Field[] = [{
    field: 'eventId',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Event ID',
    help: 'This ID is used to identify the ON24 event. Event IDs can be found in your ON24 event dashboard.',
  }, {
    field: 'registrant',
    type: FieldDefinition.Type.MAP,
    description: 'A Map of registrant fields and their values.',
    help: 'All required fields for this event must be included, or else the step will result in an error.',
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
    const registrant: Record<string, any> = stepData.registrant;

    // Search ON24 for registrant.
    try {
      apiRes = await this.client.createEventRegistrant(eventId, registrant);
      const registrantRecord = this.keyValue('registrant', 'Created Registrant', apiRes);
      return this.pass('Successfully created registrant %s for event %d.', [apiRes.email, eventId], [registrantRecord]);
    } catch (e) {
      return this.error('There was a problem creating the ON24 registrant: %s', [e.toString()]);
    }
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { CreateRegistrant as Step };
