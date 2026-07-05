import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Vectorial Data",
  description: "Política de privacidade da Vectorial Data — quais dados coletamos e como os utilizamos.",
};

export default function PtPrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-sm text-text-faint mb-8">Última atualização: 12/06/2026</p>

      <div className="prose-research space-y-8">
        <p className="text-text-muted">
          Sua privacidade é importante para nós. Esta política explica quais dados coletamos
          e como os utilizamos.
        </p>

        <section>
          <h2>1. Dados que Coletamos</h2>
          <p>
            Endereço de e-mail (para autenticação, comunicação e entrega de picks),
            informações de pagamento (processadas pela Apple ou pelo Stripe — nunca
            armazenamos dados de cartão) e dados de uso (análises agregadas de visitas).
          </p>
        </section>

        <section>
          <h2>2. Como Utilizamos seus Dados</h2>
          <p>
            Para fornecer o serviço (picks, acesso ao painel), comunicar informações sobre
            sua assinatura e melhorar o serviço por meio de análises agregadas.
          </p>
        </section>

        <section>
          <h2>3. Terceiros</h2>
          <p>
            Compartilhamos dados com: Apple (processamento de compras in-app), Stripe
            (processamento de pagamentos web), Supabase (banco de dados e autenticação),
            Vercel (hospedagem) e Resend (envio de e-mails). Cada provedor tem sua própria
            política de privacidade.
          </p>
        </section>

        <section>
          <h2>4. Retenção de Dados</h2>
          <p>
            Mantemos seus dados enquanto sua assinatura estiver ativa. Em caso de
            cancelamento, excluímos seus dados pessoais em até 30 dias, exceto quando
            exigido por lei.
          </p>
        </section>

        <section>
          <h2>5. Seus Direitos (LGPD — Lei Geral de Proteção de Dados)</h2>
          <p>
            Como usuário brasileiro, você tem os seguintes direitos nos termos da Lei nº
            13.709/2018 (LGPD):
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-3">
            <li>Confirmar a existência de tratamento de dados pessoais</li>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
            <li>Solicitar a portabilidade dos dados a outro fornecedor de serviço</li>
            <li>Eliminar dados pessoais tratados com seu consentimento</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </ul>
          <p className="mt-3">
            Para exercer esses direitos, entre em contato:{" "}
            <a href="mailto:Hello@vectorialdata.com">Hello@vectorialdata.com</a>.
          </p>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>
            Utilizamos cookies essenciais para funcionalidade (autenticação, preferências de
            idioma). Não utilizamos cookies de rastreamento de terceiros para fins publicitários.
          </p>
        </section>

        <section>
          <h2>7. Menores de Idade</h2>
          <p>
            Nosso serviço não se destina a menores de 18 anos. Não coletamos dados de menores
            de forma consciente.
          </p>
        </section>

        <section>
          <h2>8. Contato</h2>
          <p>
            Para dúvidas sobre privacidade:{" "}
            <a href="mailto:Hello@vectorialdata.com">Hello@vectorialdata.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
