# Controla - Frontend

Aplicação mobile/web para controle financeiro pessoal, consumindo a API do projeto Controla+.

---

## Tecnologias

- React Native / Expo
- JavaScript
- Axios (requisições HTTP)

---
## Funcionalidades

- Cadastro e login de usuários
- Controle financeiro pessoal
- Registro de receitas e despesas
- Dashboard financeiro
- Gráficos financeiros
- Chat inteligente com IA
- Integração com backend Spring Boot

---

## Como rodar o projeto

### Pré-requisitos

- Node.js
- npm ou yarn
- Expo CLI

---

## Instalação

```bash
npm install
```

---

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
API_URL=http://localhost:8080
```

> Para testar no celular, use o IP da sua máquina:
>
> Exemplo:
>
> API_URL=http://192.168.x.x:8080

---

## Rodando o projeto

```bash
npx expo start
```

---

## Backend

Este projeto depende do backend:

[Controla+ Backend](https://github.com/lucileny6/ControlaMais)

---
# Preview do Sistema

## Dashboard Financeiro

Tela principal com resumo financeiro, saldo atual e acompanhamento das movimentações financeiras.

![Dashboard](./documentos/Tela-Dashboard.png)

---

## Controle de Transações

Tela de gerenciamento de receitas e despesas cadastradas no sistema.

![Transações](./documentos/Tela-Transacoes.png)

---

## Assistente Inteligente

Chat financeiro integrado com IA para auxílio e registro de ações financeiras.

![Chat IA](./documentos/Tela-chat.png)

---

## Gráfico Diário

Visualização gráfica diária das movimentações financeiras registradas.

![Gráfico Diário](./documentos/Tela-gráfico-diario.png)

---

## Gráfico Mensal

Dashboard gráfico mensal para acompanhamento financeiro.

![Gráfico Mensal](./documentos/Tela-gráfico-mensal.png)

---

## Nova Transação

Tela de cadastro de novas receitas e despesas financeiras.

![Nova Transação](./documentos/Tela-nova-transação.png)

---
## Observações

- O backend deve estar rodando
- Celular e computador precisam estar na mesma rede para testes mobile

---

## Autora

Lucileny Xavier

---

## Objetivo

Projeto desenvolvido para prática de desenvolvimento mobile e web, integração backend/frontend, autenticação JWT e utilização de inteligência artificial em aplicações financeiras.
