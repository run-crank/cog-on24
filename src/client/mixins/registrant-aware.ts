
export class RegistrantAwareMixin {

  client: any;

  public getEventRegistrantByEmail(eventId: number, email: string): Promise<any> {
    return this.client.analytics.listEventRegistrants(eventId, { email });
  }

  public createEventRegistrant(eventId: number, registrant: Record<string, any>): Promise<any> {
    return this.client.registration.createRegistrant(eventId, registrant);
  }

  public forgetEventRegistrantByEmail(eventId: number, email: string): Promise<any> {
    return this.client.registration.forgetRegistrant(email, eventId);
  }

}
