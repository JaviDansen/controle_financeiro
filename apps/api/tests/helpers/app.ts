import request from 'supertest'
import { app } from '../../src/index'

export function api() {
  return request(app)
}
