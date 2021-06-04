import request from 'supertest';
import app from '../src/index.js';


//without token

describe('GET /', () => {
  it('should be redirected', async () => {
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

describe('DELETE /services/name', () => {
  it('should be unauthorized', async () => {
    await request(app).delete('/services/name').expect(401);
  });
});

describe('PUT /services/name', () => {
  it('should be unauthorized', async () => {
    await request(app).put('/services/name').expect(401);
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
