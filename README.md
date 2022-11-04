# Register specification GitHub action

This action validates and creates optimization model formulations from version
controlled sources.

## Inputs

### `authorization`

**Required** Opvious API access token.

### `sources`

**Required** Glob of source paths. The name of the formulation will be assumed
equal to the name of the source file (after stripping any extension).

### `tags`

Comma-separated list of tags to apply to the created specification.

### `dry-run`

If true, the specifications will only be validated and not registered.

### `api-endpoint`

Opvious API endpoint.

### `hub-endpoint`

Optimization hub endpoint.

## Example usage

```yaml
uses: opvious/register-specification-action@main
with:
  authorization: ${{ secrets.OPVIOUS_TOKEN }}
  sources: sources/*.md
```
