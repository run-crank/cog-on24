/*tslint:disable:import-name*/

import On24 from 'node-on24';
import { ListEventRegistrantResult, Registrant, ForgetRegistrantResult } from 'node-on24/dist/interfaces';

export class RegistrantAwareMixin {

  client: On24;

  public getEventRegistrantByEmail(eventId: number, email: string): Promise<ListEventRegistrantResult> {
    return this.client.analytics.listEventRegistrants(eventId, { email });
  }

  public createEventRegistrant(eventId: number, registrant: Record<string, any>): Promise<Registrant> {
    return this.client.registration.createRegistrant(eventId, registrant);
  }

  public forgetEventRegistrantByEmail(eventId: number, email: string): Promise<ForgetRegistrantResult> {
    return this.client.registration.forgetRegistrant(email, eventId);
  }

}
