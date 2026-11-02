// What the customer detail page can do, for the agent (D24, D48): names equal the livewire call
// names. DetailPage.vue binds a handler to each with useAgentAction while it is mounted; both act
// on the customer the page shows.
import type { AgentAction } from '../../ui/agent/types'

export const updateCustomer: AgentAction = {
  name: 'updateCustomer',
  description: 'Changes fields of the customer on this page; send only the fields that change. A status change moves it through its lifecycle.',
  params: { name: 'Company name', email: 'Contact email', country: 'ISO 3166 country code, e.g. DE', status: 'active, onHold or churned' },
  page: 'customers.detail',
  mutating: true,
}

export const deleteCustomer: AgentAction = {
  name: 'deleteCustomer',
  description: 'Deletes the customer on this page for good and returns to the list. Use only when the user asks for it.',
  page: 'customers.detail',
  mutating: true,
}

export const actions: AgentAction[] = [updateCustomer, deleteCustomer]
