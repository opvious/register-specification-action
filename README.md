# Register specification GitHub action

This action validates and creates optimization model formulations from version
controlled sources.

## Inputs

### `token`

**Required** Opvious API access token. You can create one here:
https://hub.opvious.io/authorizations.

### `sources`

**Required** Glob of source paths. The name of the formulation will be assumed
equal to the name of the source file, for example `sources/shift-scheduling.md`
would be registed as `shift-scheduling`.

### `tags`

Comma-separated list of tags to apply to the created specification. By default
only the `latest` tag is applied.

### `dry-run`

If true, the specifications will only be validated and not registered.

### `api-endpoint`

Opvious API endpoint. Defaults to https://api.opvious.io.

### `hub-endpoint`

Optimization hub endpoint. Defaults to https://hub.opvious.io.

## Example usage

```yaml
uses: opvious/register-specification-action@main
with:
  token: ${{ secrets.OPVIOUS_TOKEN }}
  sources: sources/*.md
```
