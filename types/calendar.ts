export interface CalendarEvent {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    type: 'class' | 'evaluation' | 'deadline' | 'custom' | 'gcal';
    color: string;
    groupId?: string;
}
