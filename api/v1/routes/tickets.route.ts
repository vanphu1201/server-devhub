import { Router } from "express";
import * as controller from "../controllers/tickets.controller";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";

const route = Router();

route.post("/", requireAuth, controller.createTicket);
route.get("/", requireAuth, controller.getTickets);
route.get("/admin/all", requireAuth, requireAdmin, controller.getAdminAllTickets);

route.get("/:ticketId", requireAuth, controller.getTicket);
route.post("/:ticketId/messages", requireAuth, controller.replyTicket);
route.get("/:ticketId/messages", requireAuth, controller.getTicketMessages);
route.put("/:ticketId/status", requireAuth, requireAdmin, controller.updateTicketStatus);

export const ticketsRoute = route;
