import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Serviço | Vectorial Data",
  description: "Termos de serviço da Vectorial Data, divulgação de renovação automática e avisos legais.",
  alternates: { canonical: "https://vectorialdata.com/pt/terms" },
};

export default function PtTermsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Termos de Serviço</h1>
      <p className="text-sm text-text-faint mb-8">Última atualização: 12/06/2026</p>

      <div className="prose-research space-y-8">
        <p className="text-text-muted">
          Bem-vindo à Vectorial Data. Ao usar nosso serviço, você concorda com estes termos.
        </p>

        <section>
          <h2>1. O Serviço</h2>
          <p>
            A Vectorial Data é um serviço editorial que fornece conteúdo educativo e informativo
            sobre ações e investimentos. Publicamos seleções de ações ("picks") com análises
            detalhadas. Isso NÃO constitui assessoria de investimentos personalizada. Operamos
            como um serviço editorial de informação financeira impessoal e de caráter geral.
          </p>
        </section>

        <section>
          <h2>2. Elegibilidade</h2>
          <p>
            Você deve ter pelo menos 18 anos para usar este serviço. O serviço não está disponível
            para residentes de países sujeitos a sanções da OFAC, incluindo Cuba, Irã, Coreia do
            Norte, Síria e a região da Crimeia.
          </p>
        </section>

        <section>
          <h2>3. Assinatura e Renovação Automática (Apple In-App Purchase)</h2>
          <p>
            O Vectorial Data Premium está disponível como assinatura de renovação automática
            por meio do Apple In-App Purchase.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Valor da assinatura:</strong> US$ 0,99 por mês.</li>
            <li>
              <strong>Renovação automática:</strong> Sua assinatura é renovada automaticamente
              todo mês, a menos que seja cancelada com pelo menos 24 horas de antecedência em
              relação ao fim do período atual.
            </li>
            <li>
              <strong>Cobrança:</strong> Sua conta Apple ID será cobrada pela renovação até
              24 horas antes do término do período vigente.
            </li>
            <li>
              <strong>Como cancelar:</strong> Gerencie ou cancele sua assinatura a qualquer
              momento nas Configurações do Apple ID (Ajustes → [seu nome] → Assinaturas) ou
              em settings.apple.com.
            </li>
            <li>
              <strong>Sem reembolsos parciais:</strong> O cancelamento entra em vigor no final
              do período de cobrança atual. Não são concedidos reembolsos por períodos não
              utilizados.
            </li>
            <li>
              <strong>Assinaturas web</strong> são processadas pelo Stripe e podem ser
              canceladas a qualquer momento, sem contratos de longo prazo ou multas.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Limitação de Responsabilidade</h2>
          <p>
            A Vectorial Data não se responsabiliza por perdas em investimentos. Todo o conteúdo
            é fornecido "como está", sem garantias de nenhuma natureza. As decisões de
            investimento são de responsabilidade exclusiva do usuário. O desempenho passado
            não garante resultados futuros.
          </p>
        </section>

        <section>
          <h2>5. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo de pesquisa, materiais escritos e recursos visuais são propriedade
            da Vectorial Data e estão protegidos por direitos autorais. Você pode compartilhar
            links para nosso conteúdo, mas não pode reproduzir, distribuir ou revender nossas
            análises.
          </p>
        </section>

        <section>
          <h2>6. Lei Aplicável</h2>
          <p>
            Estes termos são regidos pelas leis do México. Quaisquer disputas serão resolvidas
            por arbitragem.
          </p>
        </section>

        <section>
          <h2>7. Aviso CVM (Brasil)</h2>
          <p>
            Este serviço não é registrado na Comissão de Valores Mobiliários (CVM). O conteúdo
            é exclusivamente educativo e informativo, não constituindo assessoria ou
            recomendação de investimentos nos termos da regulamentação brasileira.
          </p>
        </section>

        <section>
          <h2>8. Contato</h2>
          <p>
            Para dúvidas sobre estes termos, entre em contato:{" "}
            <a href="mailto:Hello@vectorialdata.com">Hello@vectorialdata.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
