!macro killZombies
  nsExec::Exec 'powershell.exe -WindowStyle Hidden -Command "Stop-Process -Name ''*Docente UPSRJ*'' -Force -ErrorAction SilentlyContinue"'
  Pop $0
  Sleep 1500
!macroend

!macro customInit
  !insertmacro killZombies
!macroend

!macro customCheckAppRunning
  !insertmacro killZombies
!macroend

!macro customUnCheckAppRunning
  !insertmacro killZombies
!macroend

