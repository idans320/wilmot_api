import { response } from 'express';
import request from 'supertest';
import app from '../src/app.js';
import db from "../src/shared/db"
import admin from "./admin_user.js"

const { user, password } = admin


//without token

describe('GET /', () => {
  it('should be redirected', async () => {
    await db.users.register(user, password, "admin", true)
    await request(app).get('/').expect(302);
  });
});

describe('GET /services/', () => {
  it('should be redirected', async () => {
    await request(app).get('/services/').expect(200);
  });
});

describe('POST /services', () => {
  it('should be unauthorized', async () => {
    await request(app).post('/services').expect(401);
  });
});


describe('POST /admin/add_user', () => {
  it('should be unauthorized', async () => {
    await request(app).post('/admin/add_user').expect(401);
  });
});

describe('POST /admin/add_role', () => {
  it('should be unauthorized', async () => {
    await request(app).post('/admin/add_role').expect(401);
  });
});

describe('GET /404', () => {
  it('should return 404 for non-existent URLs', async () => {
    await request(app).get('/404').expect(404);
    await request(app).get('/notfound').expect(404);
  });
});

const login = async (user, password) => {
  const response = (await request(app).post('/login')
    .send({ "username": user, "password": password })
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json'))
  let text = response.text  
  return JSON.parse(text).token
}
//with admin
describe('POST /login', () => {
  it('should be ok', async () => {
    const response = await request(app).post('/login')
      .send({ "username": user, "password": password })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);
  });
});

describe('POST /admin/add_role', () => {
  it('should be created', async () => {
    let token = await login(user, password)
    const response = await request(app).post('/admin/add_role')
      .send({ "roleName": "test" })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(201);
  });
});

describe('POST /admin/add_role', () => {
  it('should be conflicted', async () => {
    let token = await login(user, password)
    const response = await request(app).post('/admin/add_role')
      .send({ "roleName": "test" })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(409);
  });
});

describe('POST /admin/add_user', () => {
  it('should be created', async () => {
    let token = await login(user, password)
    const response = await request(app).post('/admin/add_user')
      .send({ "username": "tester", "password": "tester", "role": "test", "editor": false })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(201);
  });
});

describe('POST /admin/add_user', () => {
  it('should be conflicted', async () => {
    let token = await login(user, password)
    await request(app).post('/admin/add_user')
      .send({ "username": "tester", "password": "tester", "role": "test", "editor": true })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(409)
  });
});

describe('POST /admin/add_user', () => {
  it('add editor', async () => {
    let token = await login(user, password)
    const response = await request(app).post('/admin/add_user')
      .send({ "username": "tester_editor", "password": "tester", "role": "test", "editor": true })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(201);
  });
});

describe('POST /services', () => {
  it('should be created', async () => {
    let token = await login(user, password)
    await request(app).post('/services')
      .send({ "name": "test", "data": {}, "role": "test" })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(201)
  });
});

describe('POST /services', () => {
  it('should be conflicted', async () => {
    let token = await login(user, password)
    await request(app).post('/services')
      .send({ "name": "test", "data": {}, "role": "test" })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(409)
  })
});

describe('GET /services/test', () => {
  it('should be ok', async () => {
    let token = await login(user, password)
    await request(app).get('/services/test')
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(200)
  });
});

describe('GET /services/test', () => {
  it('should be unauthorized', async () => {
    await request(app).get('/services/test')
      .expect(401)
  });
});


describe('GET anonymous /services/test', () => {
  it('should be unauthorized', async () => {
    await request(app).get('/services/test/')
    .set('Content-Type', 'application/json')
      .expect(401)
  });
});

describe('DELETE non editor /services/test', () => {
  it('should be unauthorized', async () => {
    let [user,password] = ["tester","tester"]
    let token = await login(user, password)
    await request(app).delete('/services/test/')
      .set('Authorization', token)
      .expect(401)
  });
});

describe('PUT non editor /services/test', () => {
  it('should be unauthorized', async () => {
    let [user,password] = ["tester","tester"]
    let token = await login(user, password)
    await request(app).put('/services/test/')
      .set('Authorization', token)
      .expect(401)
  });
});


describe('DELETE anonymous /services/test', () => {
  it('should be unauthorized', async () => {
    await request(app).delete('/services/test/')
      .expect(401)
  });
});

describe('PUT anonymous /services/test', () => {
  it('should be unauthorized', async () => {
    await request(app).put('/services/test/')
      .expect(401)
  });
});

describe('PUT admin /services/test', () => {
  it('should be invalid request', async () => {
    let token = await login(user, password)
    await request(app).put('/services/test/')
      .send("hello world")
      .set('Authorization', token)
      .expect(400)
  });
});

describe('PUT admin /services/test', () => {
  it('should be created', async () => {
    let token = await login(user, password)
    await request(app).put('/services/test/')
      .send({"b":"B"})
      .set('Content-Type', 'application/json')
      .set('Authorization', token)
      .expect(201)
  });
});

describe('GET admin /services/test', () => {
  it('should be as changed', async () => {
    let token = await login(user, password)
    const res = await request(app).get('/services/test')
      .set('Content-Type', 'application/json')
      .set('Authorization', token)
      .expect(200);
      
      console.log(res.text);
      expect(JSON.parse(res.text).b).toBe("B")
  });
});

describe('POST editor /services', () => {
  it('should be created', async () => {
    let [user,password] = ["tester_editor","tester"]
    let token = await login(user, password)
    await request(app).post('/services')
      .send({ "name": "test_editor", "data": {}, "role": "test" })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .expect(201)
  });
});

describe('PUT editor /services/test_editor', () => {
  it('should be created', async () => {
    let token = await login(user, password)
    await request(app).put('/services/test_editor')
      .send({"b":"B"})
      .set('Content-Type', 'application/json')
      .set('Authorization', token)
      .expect(201)
  });
});

describe('DELETE editor /services/test_editor', () => {
  it('should be created', async () => {
    let token = await login(user, password)
    await request(app).delete('/services/test_editor')
      .set('Content-Type', 'application/json')
      .set('Authorization', token)
      .expect(201)
  });
});

var server

beforeAll(async () => {
  const port = 3000
  server = app.listen(port)
})
afterAll(async done => {
  // Closing the DB connection allows Jest to exit successfully.
  db.close()
  await server.removeAllListeners()
  await server.close((e) => console.error(e))

  done();
});