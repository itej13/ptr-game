import { bus } from '../OperationBus'
import { ConceptPauseManager } from './ConceptPauseManager'

// Side-effect module: wire concept:resume → ConceptPauseManager.resume()
bus.on('concept:resume', () => {
  ConceptPauseManager.resume()
})
