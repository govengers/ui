// What the customers list can do, for the agent (D24, D48): names equal the livewire call names.
// ListPage.vue binds a handler to each with useAgentAction while it is mounted.
import type { AgentAction } from '../../ui/agent/types'

export const createCustomer: AgentAction = {
  name: 'createCustomer',
  description: 'Creates a customer. Use when the user wants to add a new customer account.',
  params: { name: 'Company name', email: 'Contact email', status: 'active, onHold or churned', country: 'ISO 3166 country code, e.g. DE' },
  page: 'customers.list',
  mutating: true,
}

export const deleteCustomer: AgentAction = {
  name: 'deleteCustomer',
  description: 'Deletes one customer for good. Use only when the user asks to delete a named customer.',
  params: { id: 'The customer id' },
  page: 'customers.list',
  mutating: true,
}

export const actions: AgentAction[] = [createCustomer, deleteCustomer]
