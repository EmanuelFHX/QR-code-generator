# QR Code Generator

Aplicacao web para criar, personalizar e exportar QR Codes em PNG. O projeto oferece uma interface moderna em tema escuro/claro, com preview em tempo real e controles visuais para ajustar o QR Code antes do download.

## Sobre o projeto

O QR Code Generator foi desenvolvido para gerar QR Codes de forma rapida e visual. O usuario pode escolher o tipo de conteudo, alterar cores, tamanho, formato dos pontos, margem de leitura, nivel de correcao de erro e incluir ou remover um logo central.

O preview e atualizado automaticamente a cada alteracao, permitindo testar o resultado antes de baixar ou copiar a imagem.

## Funcionalidades

- Geracao de QR Code para link, texto, telefone, email, Wi-Fi e outros conteudos.
- Personalizacao da cor do QR Code e da cor de fundo.
- Escolha do formato dos pontos: quadrado, arredondado, circular e extra arredondado.
- Controle de tamanho do arquivo gerado.
- Logo central opcional.
- Opcoes avancadas para margem, brilho e correcao de erro.
- Alternancia entre tema claro e tema escuro.
- Modal explicativo com instrucoes de uso.
- Download do QR Code em PNG.
- Copia do QR Code para a area de transferencia.

## Tecnologias

- React
- TypeScript
- Vinext
- Tailwind CSS
- qrcode

## Como rodar localmente

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse no navegador:

```text
http://localhost:3000
```

## Build

Para gerar uma build de producao:

```bash
npm run build
```

## Objetivo

O objetivo do projeto e entregar uma ferramenta simples, bonita e funcional para criar QR Codes personalizados sem depender de plataformas externas.
