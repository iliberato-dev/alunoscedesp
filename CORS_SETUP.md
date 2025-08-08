# 🚨 Solução para Erro CORS

## Problema

```
Access to fetch at 'https://script.google.com/...' from origin 'http://127.0.0.1:5500' has been blocked by CORS policy
```

## ✅ Soluções (em ordem de prioridade)

### 1. **Configurar Web App Corretamente**

1. Abra o Google Apps Script
2. Clique em **"Deploy" → "New deployment"**
3. Configure:
   - **Type**: Web app
   - **Execute as**: Me (sua conta)
   - **Who has access**: **Anyone** (CRÍTICO!)
4. Clique **"Deploy"**
5. Copie a nova URL e atualize no `script.js`

### 2. **Usar HTTPS em vez de HTTP**

- ❌ `http://127.0.0.1:5500` (não funciona)
- ✅ Use Live Server com HTTPS ou
- ✅ Hospede no GitHub Pages/Vercel

### 3. **Teste Alternativo - Arquivo Local**

1. Feche o Live Server
2. Abra `index.html` diretamente no navegador (file://)
3. Funciona sem problemas de CORS

### 4. **Teste de Conectividade**

Abra o Console do navegador (F12) e execute:

```javascript
testarCORS();
```

## 🔧 Debug do App Script

Execute no Google Apps Script:

```javascript
testarCORSCorrigido();
```

## 📋 Checklist de Verificação

- [ ] Web App configurado como "Anyone can access"
- [ ] URL do Web App atualizada no script.js
- [ ] Testando em HTTPS ou file://
- [ ] Funções CORS implementadas (doOptions, criarRespostaJson)
- [ ] Headers CORS completos configurados

## 🎯 Solução Rápida

**Para testar imediatamente:**

1. Clique duas vezes no arquivo `index.html`
2. Abra diretamente no navegador
3. Não use Live Server temporariamente

Isso contorna o problema CORS completamente!
