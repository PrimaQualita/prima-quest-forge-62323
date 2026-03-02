
## Alterar aba padrão do gráfico "Taxa de Compliance"

Mudar a aba selecionada por padrão de "Departamentos" para "Contratos de Gestão" no componente `BIDepartmentChart`.

### Detalhes técnicos

No arquivo `src/components/reports/BIDepartmentChart.tsx`, linha 126, alterar o valor inicial do estado:

```typescript
// De:
const [activeTab, setActiveTab] = useState<"departments" | "contracts">("departments");

// Para:
const [activeTab, setActiveTab] = useState<"departments" | "contracts">("contracts");
```

Isso garante que ao carregar ou atualizar a página, a aba "Contratos de Gestão" será exibida primeiro, mas o usuário pode alternar livremente para "Departamentos".
