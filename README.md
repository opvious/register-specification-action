# Register specification GitHub action

This action validates and creates optimization model formulations from version
controlled sources.

## Inputs

### `token`

**Required** Opvious API access token. You can create one here:
https://hub.beta.opvious.io/authorizations.

### `sources`

**Required** Glob of source paths. The name of the formulation will be assumed
equal to the name of the source file, for example `sources/shift-scheduling.md`
would be registed as `shift-scheduling`.

### `tags`

Comma-separated list of tags to apply to the created specification. By default
only the `latest` tag is applied. This can be useful to add a `ci` tag or
version-specific tags for easier tracking.

### `dry-run`

If true, specifications will only be validated (and not registered). Defaults to
false.

### `api-endpoint`

Opvious API endpoint. You should only need to set this if you are using a
self-hosted Opvious cluster. Defaults to https://api.beta.opvious.io.

## Example usage

```yaml
uses: opvious/register-specification-action@beta
with:
  token: ${{ secrets.OPVIOUS_TOKEN }}
  sources: sources/*.md
```
