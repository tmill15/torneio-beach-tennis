# Ícones PWA - BeachTennis Manager

## Ícones Necessários

Os seguintes ícones devem ser criados para o PWA:

1. **icon-192x192.png** (192x192px)
   - Ícone principal para Android
   - Formato: PNG
   - Fundo: Branco ou transparente
   - Design: Logo do Beach Tennis (raquete e bola)

2. **icon-512x512.png** (512x512px)
   - Ícone de alta resolução
   - Formato: PNG
   - Mesmo design do 192x192, apenas maior

3. **favicon.ico** (32x32px ou 16x16px)
   - Ícone do navegador
   - Formato: ICO
   - Versão simplificada do logo

4. **apple-touch-icon.png** (180x180px)
   - Ícone para iOS/Safari
   - Formato: PNG
   - Mesmo design, otimizado para iOS

## Design Sugerido

- Cor primária: #f97316 (laranja)
- Símbolo: Raquete de Beach Tennis cruzada com bola
- Estilo: Moderno, minimalista, flat design
- Texto: "BT" ou apenas ícone

## Ferramentas para Criar

- Figma / Adobe XD
- Canva
- Inkscape
- Icon generators online:
  - https://www.pwabuilder.com/imageGenerator
  - https://realfavicongenerator.net/

## Geração Automática

Para gerar os ícones a partir de uma imagem SVG ou PNG de 512x512:

```bash
# Usando imagemagick
convert icon-512x512.png -resize 192x192 icon-192x192.png
convert icon-512x512.png -resize 180x180 apple-touch-icon.png
convert icon-512x512.png -resize 32x32 favicon.ico
```

## Status

⚠️ **AÇÃO NECESSÁRIA:** Os ícones precisam ser criados manualmente.

Por enquanto, o PWA está configurado mas não terá ícones visíveis até que sejam criados.
