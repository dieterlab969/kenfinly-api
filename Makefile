.PHONY: fix-permission

fix-permission:
	@echo "Fixing permissions..."
	@./scripts/fix-permissions.sh $(PATH) $(USER) $(GROUP)
