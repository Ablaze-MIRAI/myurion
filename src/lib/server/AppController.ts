import Elysia, { error, t } from "elysia";

import type { PasskeyAuthService } from "$lib/server/services/AuthService";
import type { NoteService } from "$lib/server/services/NoteService";
import type { UserService } from "$lib/server/services/UserService";

export class AppController {
    constructor(
        private readonly router: Elysia,
        private readonly userService: UserService,
        private readonly noteService: NoteService,
        private readonly passkeyAuthService: PasskeyAuthService
    ) {}

    private readonly errorHandler = (app: Elysia) =>
        app.onError(({ code, error, set }) => {
            if (code == "NOT_FOUND") {
                set.status = 404;
                return "Not found";
            }

            if (code == "VALIDATION") {
                set.status = 400;
                return "Invalid request";
            }


            // @ts-ignore
            if (code == 401) {
                // なぜかset.status = 401が型エラーになる
                return new Response("Unauthorized", {status: 401});
            }

            // 想定されないエラーは全部500
            console.error(`ERROR OCCURRED: ${error}`);
            console.error("===== STACK =====");
            console.error(error.stack);
            console.error("=================");
            set.status = 500;
            return "An unexpected error occurred. The request was aborted.";
        });

    public configAuthRouter() {
        this.router.post("/auth/register-request", async ({body, cookie: {challengeSession}}) => {
            const user = await this.userService.createUser({name: body.displayName});
            const res = await this.passkeyAuthService.genRegisterChallenge(user.id, body.displayName);

            challengeSession.value = res.encryptedChallenge;
            challengeSession.httpOnly = true;
            challengeSession.secure = true;
            challengeSession.sameSite = "strict";
            challengeSession.expires = new Date(Date.now() + 60 * 1000);
            challengeSession.path = "/auth/verify-registration";

            return res.options;
        }, {
            body: t.Object({
                displayName: t.String({
                    error: "displayName must be a string"
                })
            })
        });

        this.router.post("/auth/verify-registration", async ({body, cookie}) => {
            const encryptedChallenge = cookie.challengeSession.value;
            const ok = await this.passkeyAuthService.verifyRegistration(encryptedChallenge, body as unknown);
            if (!ok) {
                return new Response("Invalid challenge", {status: 400});
            }
        }, {
            cookie: t.Object({
                challengeSession: t.String({
                    error: "challengeSession must be a string"
                })
            })
        });

        this.router.get("/auth/login-request", async ({cookie: {challengeSession}}) => {
            const res = await this.passkeyAuthService.genLoginChallenge();
            challengeSession.value = res.encryptedChallenge;
            challengeSession.httpOnly = true;
            challengeSession.secure = true;
            challengeSession.sameSite = "strict";
            challengeSession.expires = new Date(Date.now() + 60 * 1000);
            challengeSession.path = "/auth/verify-login";

            return res.options;
        });

        this.router.post("/auth/verify-login", async ({body, cookie: {challengeSession, token}}) => {
            const encryptedChallenge = challengeSession.value;
            const generatedToken = await this.passkeyAuthService.verifyLogin(encryptedChallenge, body as unknown);
            if (!token) {
                return new Response("Invalid challenge", {status: 400});
            }

            token.value = generatedToken;
            token.httpOnly = true;
            token.secure = true;
            token.sameSite = "strict";
            token.expires = new Date(Date.now() + 30 * 60 * 1000);
            token.path = "/api";

            return "OK";
        }, {
            cookie: t.Object({
                challengeSession: t.String({
                    error: "challengeSession must be a string"
                }),
            })
        });
    }

    public configApiRouter() {
        this.router.use(this.errorHandler);
        this.router.derive(({ cookie: {token} }) => {
            // Auth middleware
            if (!token || !token.value) {
                return error(401, {
                    message: "Unauthorized",
                    uid: null,
                });
            }

            try {
                const user = this.passkeyAuthService.decryptToken(token.value, false);
                if (!user) {
                    throw new Error("Invalid token");
                }

                return {
                    uid: user.uid,
                };
            } catch {
                return error(401, {
                    message: "Unauthorized",
                    uid: null,
                });
            }
        })
            .get("/api/me", async ({uid}) => {
                return await this.userService.getUserById(uid);
            })

            .put("/api/me/quick-note", async ({uid, body}) => {
                await this.userService.updateQuickNote(uid, body.content);
                return {
                    saved: true
                };
            }, {
                body: t.Object({
                    content: t.String({
                        error: "content must be a string"
                    })
                })
            })

            .get("/api/me/quick-note", async ({uid}) => {
                const note = await this.userService.getQuickNote(uid);
                return {
                    content: note
                };
            })

            .post("/api/me/promote-quick-note", async ({uid, body}) => {
                const quickNoteContent = await this.userService.getQuickNote(uid);
                const created = await this.noteService.createNote(uid, body.title, quickNoteContent, body.categoryId);
                await this.userService.updateQuickNote(uid, "");
                return { created };
            }, {
                body: t.Object({
                    categoryId: t.String({
                        error: "id must be a string"
                    }),
                    title: t.String({
                        error: "title must be a string"
                    })
                })
            })

            .post("/api/note/create", async ({uid, body}) => {
                const created = await this.noteService.createNote(uid, body.title, body.content, body.categoryId);
                return {
                    id: created
                };
            }, {
                body: t.Object({
                    title: t.String({
                        error: "title must be a string"
                    }),
                    content: t.String({
                        error: "content must be a string"
                    }),
                    categoryId: t.String({
                        error: "categoryId must be a string"
                    })
                })
            })

            .get("/api/note/tree", async ({uid}) => {
                return await this.noteService.getNoteTreeByUserId(uid);
            })

            .post("/api/note/create-category", async ({uid, body}) => {
                const categoryId = await this.noteService.createNoteCategory(uid, body.name, body.iconName);
                return {
                    id: categoryId
                };
            }, {
                body: t.Object({
                    name: t.String({
                        error: "name must be a string"
                    }),
                    iconName: t.String({
                        error: "iconName must be a string"
                    })
                })
            })

            .get("/api/note/categories", async ({uid}) => {
                return await this.noteService.getNoteCategoriesByUserId(uid);
            })

            // catch-allなので最後に置く
            .get("/api/note/:noteId", async ({uid, params}) => {
                return await this.noteService.getNoteById(uid, params.noteId);
            }, {
                params: t.Object({
                    noteId: t.String({
                        error: "noteId must be a string"
                    })
                })
            })

            .put("/api/note/:noteId", async ({uid, params, body}) => {
                const updated = await this.noteService.updateNoteById(uid, params.noteId, body.title, body.content);
                return { ok: updated };
            }, {
                params: t.Object({
                    noteId: t.String({
                        error: "noteId must be a string"
                    })
                }),
                body: t.Object({
                    title: t.String({
                        error: "title must be a string"
                    }),
                    content: t.String({
                        error: "content must be a string"
                    })
                })
            })

            .delete("/api/note/:noteId", async ({uid, params}) => {
                const deleted = await this.noteService.deleteNoteById(uid, params.noteId);
                return { ok: deleted };
            }, {
                params: t.Object({
                    noteId: t.String({
                        error: "noteId must be a string"
                    })
                })
            });
    }
}
