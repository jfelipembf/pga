# Proposta de Refatoração e Otimização do Módulo de Clientes (CRM)

Após análise dos serviços da pasta `src/services/Clients/` (especialmente `CRMService.js`, `ClientContractService.js`, `ClientService.js`, e `EnrollmentService.js`), identifiquei gargalos estruturais em relação a boas práticas e eficiência de consumo no Firebase Firestore. Segue abaixo a nossa proposta de melhoria.

## 1. O Problema Atual: Alto Consumo de Leituras (Reads)
O Firebase cobra por leitura de documento. Atualmente, sempre que a tela de CRM ou a listagem de clientes precisa realizar qualquer busca ou filtro, o `CRMService.js` faz o seguinte:

```javascript
const [allClients, allContracts, allEnrollments, allSales] = await Promise.all([
    clientRepository.findActive(idTenant, idBranch),
    clientContractRepository.findAll(idTenant, idBranch), 
    enrollmentRepository.findAll(idTenant, idBranch),
    salesRepository.findAll(idTenant, idBranch)
])
```
Isso significa que, se você tiver 500 clientes, 800 matrículas, 700 contratos e 1000 vendas registradas, a cada acesso ou filtro o sistema consome **~3.000 leituras (Reads)**. Se essa tela for aberta muitas vezes ao dia, os custos de Firebase irão disparar à medida que o banco de dados da academia crescer.

Além disso, em `EnrollmentService.js`, cada matrícula busca de forma avulsa dados que poderiam ser aglutinados e cacheados (Staff, Activity, Classes).

## 2. A Solução Proposta: Desnormalização Ativa (Padrão NoSQL)

No mundo NoSQL (Firestore), devemos otimizar para leitura, mesmo que isso custe mais trabalho na hora de escrever. Nós devemos trazer a resposta mastigada para o documento do `client`.

### Ação Prática: Enriquecer o Documento do Cliente (`client`)
Em vez de cruzar as entidades em tempo de execução no frontend (calculando contratos e matrículas ativas a cada acesso), devemos modificar o `ClientContractService` e o `EnrollmentService` para sempre atualizarem metadados chamados **"Computed Fields"** diretamente dentro do documento do respectivo Cliente na hora de salvar.

O documento de um cliente na collection `clients` deveria passar a ter os atributos consolidados:

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "lifecycleStatus": "active",
  
  // -- NOVOS CAMPOS DESNORMALIZADOS --
  "computed": {
    "activeContractId": "xyz...",
    "activePlanName": "Plano Anual Natação",
    "contractEndDate": "2027-02-19T00:00:00.000Z",
    "monthlyValue": 150.00,
    "activeActivities": ["Natação", "Musculação"],
    "activeInstructors": ["id-instrutor-1", "id-instrutor-2"],
    "lastPurchaseDate": "2026-02-15T00:00:00.000Z"
  }
}
```

## 3. Arquivos Impactados e as Mudanças Necessárias

### I. `src/services/Clients/ClientService.js`
- Hoje calcula o status lendo todos os contratos (`calculateLiveStatus`). Esse cálculo deve se manter, mas sempre que o status for recalculado, deve-se gravar o status mais recente no objeto `computed` do documento no Firestore.

### II. `src/services/Clients/ClientContractService.js` & `ContractCancellationService.js`
- **Quando:** ao criar (`create`), suspender (`suspend`), ou cancelar (`cancel`) um contrato.
- **Mudança:** Além de atualizar a collection de `contracts`, deve ser executado um `update` simples em `clients/{id}` atualizando `activePlanName`, `contractEndDate` e `monthlyValue`. Se o contrato for cancelado, esses campos do cliente viram `null`. Isso será garantido e facilitado pelo Firebase Transactions.

### III. `src/services/Clients/EnrollmentService.js`
- **Quando:** ao agendar/matricular (`enrollClient`, `scheduleTrialClass`) ou cancelar (`cancelEnrollment`).
- **Mudança:** Ao adicionar uma matrícula, o sistema lerá o array de `computed.activeActivities` e `computed.activeInstructors` do cliente e fará um append da nova atividade, persistindo na base. 

### IV. `src/services/Clients/CRMService.js` (O Maior Benefício)
- O código que puxa massivamente `allContracts`, `allEnrollments` e `allSales` será substituído!
- Agora, a busca chamará apenas **UMA** query em `clients`:
```javascript
let q = query(collection(db, `tenants/${idTenant}/branches/${idBranch}/clients`));

// Querying fields inside 'computed' directly:
if (filters.activity) {
    q = query(q, where('computed.activeActivities', 'array-contains', filters.activity));
}
if (filters.planName) {
    q = query(q, where('computed.activePlanName', '==', filters.planName));
}
```
Isso descerá o número de Reads de 3.000+ para apenas o número exato de clientes filtrados, que serão exibidos com uso de paginação (`limit(50)`). 

## 4. Benefícios Comprovados
- **Escalabilidade Extrema:** Uma academia com 10.000 alunos carregará o sistema na mesma velocidade que uma com 100 alunos.
- **Queda Abrupta no Custo:** A fatura do Firebase (Docs Read) despencará.
- **Experiência do Usuário (UI):** O painel e relatórios carregarão quase instantaneamente devido ao fato destas consultas retornarem diretamente resultados em indexações rasas, não dependendo de joins complexos em Javascript.

---
**Podemos iniciar a elaboração da arquitetura se você estiver de pleno acordo com esta proposta! O passo número #1 consistiria na modificação de nossos Contratos/Enrollments e no Job de Migração do histórico.**
