import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../dist/app.js';

test('FarmaOPO API Test Suite', async (t) => {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  t.after(() => {
    server.close();
  });

  await t.test('GET /health deve retornar status 200 UP', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'UP');
    assert.equal(body.service, 'FarmaOPO API');
  });

  await t.test('GET /medications deve listar registros iniciais', async () => {
    const res = await fetch(`${baseUrl}/medications`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
  });

  await t.test('POST /medications com dados invalidos deve retornar 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', dosage: '' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(body.error.details));
  });

  let createdId = '';
  const uniqueName = `MedTeste-${Date.now()}`;

  await t.test('POST /medications com dados validos deve cadastrar com sucesso 201', async () => {
    const res = await fetch(`${baseUrl}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: uniqueName,
        dosage: '100 mg',
        time: '12:00',
        observations: 'Teste automatizado',
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.name, uniqueName);
    assert.ok(body.data.id);
    createdId = body.data.id;
  });

  await t.test('POST /medications duplicado deve retornar 409 CONFLICT', async () => {
    const res = await fetch(`${baseUrl}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: uniqueName,
        dosage: '100 mg',
        time: '12:00',
      }),
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'CONFLICT');
  });

  await t.test('POST /medications/briefing deve gerar briefing com disclaimer regulatorio da ANVISA', async () => {
    const res = await fetch(`${baseUrl}/medications/briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dipirona Monoidratada',
        dosage: '500 mg',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.pharmacologicalClass);
    assert.ok(Array.isArray(body.data.mainIndications));
    assert.ok(body.data.mandatoryDisclaimer.includes('bula oficial'));
  });

  await t.test('DELETE /medications/:id deve excluir o medicamento criado', async () => {
    const res = await fetch(`${baseUrl}/medications/${createdId}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 200);
  });

  await t.test('DELETE /medications/:id inexistente deve retornar 404', async () => {
    const res = await fetch(`${baseUrl}/medications/id-que-nao-existe`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});
