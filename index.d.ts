export interface TableDBChanges {
  schema: string
  table: string
  commit_timestamp: string
  eventType: string
  new: New
  old: Old
  errors: any
}

export interface New {
  description: string
  id: number
  public: boolean
  title: string
  user_id?: any
}

export interface Old { }
