#!/bin/bash

# Script para atualizar horários dos triggers agendados
# Todos rodarão após meia-noite com intervalos de 15 minutos

cd /Users/felipemacedo/Downloads/PGA-Sistema/apps/app/functions/src/triggers

# 00:10 - ensureSessionsHorizon (já atualizado)

# 00:25 - processExpiredContracts
sed -i '' 's/"50 8 \* \* \*"/"25 0 \* \* \*"/g' processExpiredContracts.js

# 00:40 - processInactiveContracts  
sed -i '' 's/"0 2 \* \* \*"/"40 0 \* \* \*"/g' processInactiveContracts.js

# 00:55 - processScheduledSuspensions
sed -i '' 's/"50 8 \* \* \*"/"55 0 \* \* \*"/g' processScheduledSuspensions.js

# 01:10 - processSuspensionEnds
sed -i '' 's/"50 8 \* \* \*"/"10 1 \* \* \*"/g' processSuspensionEnds.js

# 01:25 - processScheduledCancellations
sed -i '' 's/"50 8 \* \* \*"/"25 1 \* \* \*"/g' processScheduledCancellations.js

# 01:40 - processContractDefaultCancellation
sed -i '' 's/"50 8 \* \* \*"/"40 1 \* \* \*"/g' processContractDefaultCancellation.js

# 01:55 - checkExpiringContracts
sed -i '' 's/"50 8 \* \* \*"/"55 1 \* \* \*"/g' checkExpiringContracts.js

# 02:10 - checkBirthdayAutomations
sed -i '' 's/"50 8 \* \* \*"/"10 2 \* \* \*"/g' checkBirthdayAutomations.js

# 02:25 - checkExperimentalClassAutomations
sed -i '' 's/"50 8 \* \* \*"/"25 2 \* \* \*"/g' checkExperimentalClassAutomations.js

# 02:40 - processRecurringTasks
sed -i '' 's/"0 6 \* \* \*"/"40 2 \* \* \*"/g' processRecurringTasks.js

# 02:55 - autoCloseCashier
sed -i '' 's/"50 8 \* \* \*"/"55 2 \* \* \*"/g' autoCloseCashier.js

# 00:00 - autoAttendanceTrigger (enrollments)
sed -i '' 's/"0 0 \* \* \*"/"0 0 \* \* \*"/g' ../enrollments/autoAttendanceTrigger.js

echo "✅ Todos os horários dos triggers foram atualizados!"
echo ""
echo "Novo cronograma:"
echo "00:00 - autoAttendanceTrigger"
echo "00:10 - ensureSessionsHorizon"
echo "00:25 - processExpiredContracts"
echo "00:40 - processInactiveContracts"
echo "00:55 - processScheduledSuspensions"
echo "01:10 - processSuspensionEnds"
echo "01:25 - processScheduledCancellations"
echo "01:40 - processContractDefaultCancellation"
echo "01:55 - checkExpiringContracts"
echo "02:10 - checkBirthdayAutomations"
echo "02:25 - checkExperimentalClassAutomations"
echo "02:40 - processRecurringTasks"
echo "02:55 - autoCloseCashier"
