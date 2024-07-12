export interface SlotBehaviorService {
  apply(attribs: Record<string, string>): [string, any];
}
