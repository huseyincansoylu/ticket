// Domain types shared across services.
// Redis-backed types (Hold) have no `id` — the composite key (eventId + seatId) is the identity.

export interface Event {
    id: string;
    venueId: string;
    name: string;
    startsAt: Date;
}

export interface Venue {
    id: string;
    name: string;
    address: string;
}

export interface Section {
    id: string;
    name: string;
    venueId: string;
}

export interface Row {
    id: string;
    label: string;
    sectionId: string;
}

export interface Seat {
    id: string;
    rowId: string;
    number: string;
}

export type SeatStatus = "AVAILABLE" | "HELD" | "SOLD";

export interface EventSeat {
    id: string;
    eventId: string;
    seatId: string;
    status: SeatStatus;
    // (eventId, seatId) must be unique
}

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";

export interface Order {
    id: string;
    userId: string;
    eventId: string;
    status: OrderStatus;
    createdAt: Date;
}

export interface Ticket {
    id: string;
    orderId: string;
    eventId: string;
    seatId: string;
    createdAt: Date;
    // (eventId, seatId) must be unique — DB-level double-booking guard
}

export interface Hold {
    eventId: string;
    seatId: string;
    userId: string;
    expiresAt: Date;
}
