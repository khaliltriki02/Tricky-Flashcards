import { Router, type IRouter } from "express";
import { and, asc, count, eq } from "drizzle-orm";
import { db, cardsTable, decksTable } from "@workspace/db";
import {
  CreateCardBody,
  CreateCardResponse,
  CreateCardParams,
  CreateDeckBody,
  CreateDeckResponse,
  DeleteCardParams,
  DeleteDeckParams,
  GetCardParams,
  GetCardResponse,
  GetDeckParams,
  GetDeckResponse,
  ListCardsParams,
  ListCardsResponse,
  ListDecksResponse,
  UpdateCardBody,
  UpdateCardParams,
  UpdateCardResponse,
  UpdateDeckBody,
  UpdateDeckParams,
  UpdateDeckResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function userId(req: Parameters<Parameters<IRouter["get"]>[1]>[0]): string {
  return req.header("x-user-id")?.trim() || "local-user";
}

async function findDeckWithCount(id: number, owner: string) {
  const [row] = await db
    .select({
      id: decksTable.id,
      userId: decksTable.userId,
      name: decksTable.name,
      description: decksTable.description,
      createdAt: decksTable.createdAt,
      updatedAt: decksTable.updatedAt,
      cardCount: count(cardsTable.id),
    })
    .from(decksTable)
    .leftJoin(cardsTable, eq(cardsTable.deckId, decksTable.id))
    .where(and(eq(decksTable.id, id), eq(decksTable.userId, owner)))
    .groupBy(decksTable.id);
  return row ? { ...row, cardCount: Number(row.cardCount) } : undefined;
}

router.get("/decks", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: decksTable.id,
      userId: decksTable.userId,
      name: decksTable.name,
      description: decksTable.description,
      createdAt: decksTable.createdAt,
      updatedAt: decksTable.updatedAt,
      cardCount: count(cardsTable.id),
    })
    .from(decksTable)
    .leftJoin(cardsTable, eq(cardsTable.deckId, decksTable.id))
    .where(eq(decksTable.userId, userId(req)))
    .groupBy(decksTable.id)
    .orderBy(asc(decksTable.createdAt));
  res.json(ListDecksResponse.parse(rows.map((row) => ({ ...row, cardCount: Number(row.cardCount) }))));
});

router.post("/decks", async (req, res): Promise<void> => {
  const parsed = CreateDeckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [deck] = await db
    .insert(decksTable)
    .values({ ...parsed.data, userId: userId(req) })
    .returning();
  res.status(201).json(CreateDeckResponse.parse({ ...deck, cardCount: 0 }));
});

router.get("/decks/:deckId", async (req, res): Promise<void> => {
  const parsed = GetDeckParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const deck = await findDeckWithCount(parsed.data.deckId, userId(req));
  if (!deck) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }
  res.json(GetDeckResponse.parse(deck));
});

router.patch("/decks/:deckId", async (req, res): Promise<void> => {
  const params = UpdateDeckParams.safeParse(req.params);
  const body = UpdateDeckBody.safeParse(req.body);
  if (!params.success || !body.success) {
    const error = params.success ? "Invalid request body" : params.error.message;
    res.status(400).json({ error });
    return;
  }
  const [updated] = await db
    .update(decksTable)
    .set(body.data)
    .where(and(eq(decksTable.id, params.data.deckId), eq(decksTable.userId, userId(req))))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }
  const deck = await findDeckWithCount(updated.id, userId(req));
  res.json(UpdateDeckResponse.parse(deck));
});

router.delete("/decks/:deckId", async (req, res): Promise<void> => {
  const parsed = DeleteDeckParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [deleted] = await db
    .delete(decksTable)
    .where(and(eq(decksTable.id, parsed.data.deckId), eq(decksTable.userId, userId(req))))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/decks/:deckId/cards", async (req, res): Promise<void> => {
  const parsed = ListCardsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const deck = await findDeckWithCount(parsed.data.deckId, userId(req));
  if (!deck) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }
  const cards = await db
    .select({
      id: cardsTable.id,
      deckId: cardsTable.deckId,
      frontText: cardsTable.frontText,
      backText: cardsTable.backText,
      frontDrawing: cardsTable.frontDrawing,
      backDrawing: cardsTable.backDrawing,
      position: cardsTable.position,
      createdAt: cardsTable.createdAt,
      updatedAt: cardsTable.updatedAt,
    })
    .from(cardsTable)
    .where(eq(cardsTable.deckId, parsed.data.deckId))
    .orderBy(asc(cardsTable.position), asc(cardsTable.createdAt));
  res.json(ListCardsResponse.parse(cards));
});

router.post("/decks/:deckId/cards", async (req, res): Promise<void> => {
  const params = CreateCardParams.safeParse(req.params);
  const body = CreateCardBody.safeParse(req.body);
  if (!params.success || !body.success) {
    const error = params.success ? "Invalid request body" : params.error.message;
    res.status(400).json({ error });
    return;
  }
  const deck = await findDeckWithCount(params.data.deckId, userId(req));
  if (!deck) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }
  const [card] = await db
    .insert(cardsTable)
    .values({ ...body.data, deckId: params.data.deckId })
    .returning();
  res.status(201).json(CreateCardResponse.parse(card));
});

router.get("/cards/:cardId", async (req, res): Promise<void> => {
  const parsed = GetCardParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [card] = await db
    .select({ card: cardsTable, owner: decksTable.userId })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(and(eq(cardsTable.id, parsed.data.cardId), eq(decksTable.userId, userId(req))));
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  res.json(GetCardResponse.parse(card.card));
});

router.patch("/cards/:cardId", async (req, res): Promise<void> => {
  const params = UpdateCardParams.safeParse(req.params);
  const body = UpdateCardBody.safeParse(req.body);
  if (!params.success || !body.success) {
    const error = params.success ? "Invalid request body" : params.error.message;
    res.status(400).json({ error });
    return;
  }
  const [updated] = await db
    .update(cardsTable)
    .set(body.data)
    .from(decksTable)
    .where(and(eq(cardsTable.id, params.data.cardId), eq(cardsTable.deckId, decksTable.id), eq(decksTable.userId, userId(req))))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  res.json(UpdateCardResponse.parse(updated));
});

router.delete("/cards/:cardId", async (req, res): Promise<void> => {
  const parsed = DeleteCardParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [card] = await db
    .select({ id: cardsTable.id })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(and(eq(cardsTable.id, parsed.data.cardId), eq(decksTable.userId, userId(req))));
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  await db.delete(cardsTable).where(eq(cardsTable.id, card.id));
  res.sendStatus(204);
});

export default router;