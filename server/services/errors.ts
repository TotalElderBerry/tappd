/** Expected failures with an HTTP status; API handlers turn these into responses. */
export class ServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ServiceError'
  }
}
