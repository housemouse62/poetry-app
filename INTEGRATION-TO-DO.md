Auth

Register form → POST /users/create
Login form → POST /users/login
Store JWT token (replace localStorage word cache pattern)
Send token with every authenticated request
Logout (clear token)
Profile update form → PATCH /users/profile

Haiku

Save haiku → POST /haiku (replace localStorage save)
Load user's haikus → GET /haiku/mine (replace localStorage load)
Edit haiku → PATCH /haiku/:id
Delete haiku → DELETE /haiku/:id
Public feed → GET /haiku
Single haiku view → GET /haiku/:id

Limerick

Same as haiku above

Words

Word lookup → POST /word (replace/integrate with existing wordCache)
Flag word → PATCH /word/:word/flag

Social

Like/unlike poems, comments, replies
Comments → full CRUD
Replies → full CRUD
Favorites → add/remove/view

Routing

Protected routes (redirect to login if no token)
Public routes (feed, individual poems)
