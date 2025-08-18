import React, { useState } from 'react';
import Header from './components/Header';
import { Link } from 'react-router-dom';
import Button from './components/Button';
import { useFormState } from './hooks/useLocalStorage';
import { Notification as NotificationType } from './types';
import ApiService from './services/api';
import './App.css';

const App: React.FC = () => {
  const [formState, setFormState] = useFormState();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiService] = useState(() => new ApiService(formState.apiConfig));
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [signatureFormats, setSignatureFormats] = useState<{[key: string]: string}>({
    matin: 'url',
    soir: 'url'
  });

  const addNotification = (notification: Omit<NotificationType, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, notification.duration || 5000);
  };

  const updateParticipant = (field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      participant: {
        ...prev.participant,
        [field]: value
      }
    }));
  };

  const updateApiConfig = (field: string, value: string) => {
    const newConfig = {
      ...formState.apiConfig,
      [field]: value
    };
    setFormState(prev => ({
      ...prev,
      apiConfig: newConfig
    }));
    apiService.updateConfig(newConfig);
  };

  const addIntervenant = () => {
    const newIntervenant = {
      id: Date.now(),
      nom: '',
      prenom: '',
      signature_matin: '',
      signature_soir: ''
    };
    setFormState(prev => ({
      ...prev,
      intervenants: [...prev.intervenants, newIntervenant]
    }));
  };

  const updateIntervenant = (id: number, field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      intervenants: prev.intervenants.map(i =>
        i.id === id ? { ...i, [field]: value } : i
      )
    }));
  };

  const removeIntervenant = (id: number) => {
    setFormState(prev => ({
      ...prev,
      intervenants: prev.intervenants.filter(i => i.id !== id)
    }));
  };

  // Fonctions pour gérer les formats de signature
  const getSignatureFormat = (type: string) => {
    return signatureFormats[type] || 'url';
  };

  const setSignatureFormat = (type: string, format: string) => {
    setSignatureFormats(prev => ({
      ...prev,
      [type]: format
    }));
    
    // Réinitialiser la valeur si on change de format
    if (format !== getSignatureFormat(type)) {
      const field = type === 'matin' ? 'signature_matin' : 'signature_soir';
      updateParticipant(field, '');
    }
  };

  // Fonction pour gérer l'upload de fichiers
  const handleFileUpload = (type: string, file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const field = type === 'matin' ? 'signature_matin' : 'signature_soir';
      updateParticipant(field, result);
    };
    reader.readAsDataURL(file);
  };

  // Fonctions pour gérer les formats de signature des intervenants
  const getIntervenantSignatureFormat = (id: number, type: string) => {
    const key = `intervenant-${id}-${type}`;
    return signatureFormats[key] || 'url';
  };

  const setIntervenantSignatureFormat = (id: number, type: string, format: string) => {
    const key = `intervenant-${id}-${type}`;
    setSignatureFormats(prev => ({
      ...prev,
      [key]: format
    }));
    
    // Réinitialiser la valeur si on change de format
    if (format !== getIntervenantSignatureFormat(id, type)) {
      const field = type === 'matin' ? 'signature_matin' : 'signature_soir';
      updateIntervenant(id, field, '');
    }
  };

  const handleIntervenantFileUpload = (id: number, type: string, file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const field = type === 'matin' ? 'signature_matin' : 'signature_soir';
      updateIntervenant(id, field, result);
    };
    reader.readAsDataURL(file);
  };

  // Helpers de préparation des données pour l'API
  const toFrenchDate = (value: string): string => {
    if (!value) return value;
    // Accepte déjà JJ/MM/AAAA
    const frRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (frRegex.test(value)) return value;
    // Convertit YYYY-MM-DD -> DD/MM/YYYY (format des inputs de type=date)
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const m = value.match(isoRegex);
    if (m) {
      const [, yyyy, mm, dd] = m;
      return `${dd}/${mm}/${yyyy}`;
    }
    // Dernier recours: tentative de formatage en fr-FR
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('fr-FR');
    }
    return value;
  };

  const buildRequestData = () => {
    const participant = {
      ...formState.participant,
      date_du_cours: toFrenchDate(formState.participant.date_du_cours)
    };
    const intervenants = formState.intervenants
      .map(({ id, ...rest }) => rest)
      // Garder uniquement les intervenants complets pour éviter un 400 côté serveur
      .filter(i => (i.nom?.trim() || '') !== '' && (i.prenom?.trim() || '') !== '');

    return { participant, intervenants };
  };

  // Données allégées pour l'aperçu JSON (masque/tronque les images)
  const truncateValue = (value: string): string => {
    if (!value) return value;
    const isBase64 = value.startsWith('data:image/') || /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
    const isLong = value.length > 80;
    if (isBase64 || isLong) {
      const head = value.slice(0, 40);
      const tail = value.slice(-10);
      return `${head}...${tail} (len:${value.length})`;
    }
    return value;
  };

  const buildPreviewData = () => {
    const data = buildRequestData();
    return {
      participant: {
        ...data.participant,
        signature_matin: truncateValue(data.participant.signature_matin),
        signature_soir: truncateValue(data.participant.signature_soir),
      },
      intervenants: data.intervenants.map(iv => ({
        ...iv,
        signature_matin: truncateValue(iv.signature_matin),
        signature_soir: truncateValue(iv.signature_soir),
      }))
    };
  };

  // Wizard steps
  const steps = [
    { id: 1, label: 'Participant' },
    { id: 2, label: 'Intervenants' },
    { id: 3, label: 'Détails API' },
    { id: 4, label: 'Aperçu' }
  ];

  const isStepCompleted = (stepId: number): boolean => {
    if (stepId === 1) {
      const p = formState.participant;
      return (
        p.nom.trim() !== '' &&
        p.prenom.trim() !== '' &&
        p.code_session.trim() !== '' &&
        p.date_du_cours.trim() !== '' &&
        p.nom_formation.trim() !== '' &&
        p.nom_du_cours.trim() !== ''
      );
    }
    if (stepId === 2) {
      return formState.intervenants.every(i => (i.nom?.trim() || '') !== '' && (i.prenom?.trim() || '') !== '');
    }
    if (stepId === 3) {
      return formState.apiConfig.url.trim() !== '' && formState.apiConfig.key.trim() !== '';
    }
    return false;
  };

  const nextStep = () => setActiveStep(s => Math.min(s + 1, steps.length));
  const prevStep = () => setActiveStep(s => Math.max(s - 1, 1));

  const generatePdf = async () => {
    setIsLoading(true);
    try {
      const data = buildRequestData();
      
      const blob = await apiService.generatePdf(data);
      downloadFile(blob, `emargement_${new Date().toISOString().slice(0, 10)}.pdf`);
      addNotification({
        type: 'success',
        message: 'PDF généré avec succès !'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testApi = async () => {
    setIsLoading(true);
    try {
      const blob = await apiService.testApi();
      downloadFile(blob, 'test_emargement.pdf');
      addNotification({
        type: 'success',
        message: 'Test API réussi !'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Erreur de test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportJson = () => {
    const data = buildRequestData();
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, `emargement_${new Date().toISOString().slice(0, 10)}.json`);
    
    addNotification({
      type: 'success',
      message: 'JSON exporté avec succès !'
    });
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <Header />
      
      <main className="main-content">
        <div className="wizard-layout">
          <aside className="wizard-sidebar">
            <div className="sidebar-brand">
              <i className="fas fa-cube"></i>
              <span>Emargement</span>
            </div>
            <ul className="wizard-steps">
              {steps.map(step => (
                <li
                  key={step.id}
                  className={`wizard-step ${activeStep === step.id ? 'active' : ''} ${isStepCompleted(step.id) ? 'completed' : ''}`}
                  onClick={() => setActiveStep(step.id)}
                >
                  <span className="step-icon">{isStepCompleted(step.id) && step.id !== activeStep ? <i className="fas fa-check"></i> : step.id}</span>
                  <span className="step-label">{step.label}</span>
                </li>
              ))}
            </ul>
          </aside>
          <section className="wizard-content">
            <div className="wizard-card">
              {activeStep === 1 && (
                <>
          {/* Section d'aide pour les formats d'image */}
          <div className="help-section">
            <h3><i className="fas fa-info-circle"></i> Formats d'image supportés</h3>
            <div className="help-content">
              <p>Les signatures peuvent être fournies dans les formats suivants :</p>
              <ul>
                <li><strong>URL externe</strong> : <code>https://example.com/signature.png</code></li>
                <li><strong>Base64 avec préfixe</strong> : <code>data:image/png;base64,iVBORw0KGgo...</code></li>
                <li><strong>Base64 pur</strong> : <code>iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==</code></li>
                <li><strong>Fichier local</strong> : Upload direct de fichiers image</li>
              </ul>
              <p><strong>Formats d'image supportés :</strong> PNG, JPEG, SVG</p>
            </div>
                </div>
              
              
              <div className="form-section">
            <h2><i className="fas fa-user"></i> Informations du Participant</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nom">Nom *</label>
                <input
                  type="text"
                  id="nom"
                  value={formState.participant.nom}
                  onChange={(e) => updateParticipant('nom', e.target.value)}
                  placeholder="Nom du participant"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="prenom">Prénom *</label>
                <input
                  type="text"
                  id="prenom"
                  value={formState.participant.prenom}
                  onChange={(e) => updateParticipant('prenom', e.target.value)}
                  placeholder="Prénom du participant"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="code_session">Code Session *</label>
                <input
                  type="text"
                  id="code_session"
                  value={formState.participant.code_session}
                  onChange={(e) => updateParticipant('code_session', e.target.value)}
                  placeholder="Ex: SESS-2025-001"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="date_cours">Date du Cours *</label>
                <input
                  type="date"
                  id="date_cours"
                  value={formState.participant.date_du_cours}
                  onChange={(e) => updateParticipant('date_du_cours', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="nom_formation">Nom de la Formation *</label>
                <input
                  type="text"
                  id="nom_formation"
                  value={formState.participant.nom_formation}
                  onChange={(e) => updateParticipant('nom_formation', e.target.value)}
                  placeholder="Ex: Formation Développement Web"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="nom_cours">Nom du Cours *</label>
                <input
                  type="text"
                  id="nom_cours"
                  value={formState.participant.nom_du_cours}
                  onChange={(e) => updateParticipant('nom_du_cours', e.target.value)}
                  placeholder="Ex: JavaScript Avancé"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signature_matin">Signature Matin</label>
                <div className="signature-upload-container">
                  <select 
                    className="format-selector"
                    onChange={(e) => setSignatureFormat('matin', e.target.value)}
                    value={getSignatureFormat('matin')}
                  >
                    <option value="url">URL externe</option>
                    <option value="base64">Base64</option>
                    <option value="file">Fichier local</option>
                  </select>
                  
                  {getSignatureFormat('matin') === 'url' && (
                    <input
                      type="url"
                      placeholder="https://example.com/signature1.png"
                      value={formState.participant.signature_matin}
                      onChange={(e) => updateParticipant('signature_matin', e.target.value)}
                      className="signature-input"
                    />
                  )}
                  
                  {getSignatureFormat('matin') === 'base64' && (
                    <textarea
                      placeholder="data:image/png;base64,iVBORw0KGgo... ou base64 pur (PNG, JPEG, SVG)"
                      value={formState.participant.signature_matin}
                      onChange={(e) => updateParticipant('signature_matin', e.target.value)}
                      rows={3}
                      className="signature-input"
                    />
                  )}
                  
                  {getSignatureFormat('matin') === 'file' && (
                    <div className="file-upload-container">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload('matin', e.target.files?.[0])}
                        className="file-input"
                        id="file-matin"
                      />
                      <label htmlFor="file-matin" className="file-upload-label">
                        <i className="fas fa-upload"></i>
                        Choisir un fichier image
                      </label>
                      {formState.participant.signature_matin && (
                        <div className="file-preview">
                          <img src={formState.participant.signature_matin} alt="Aperçu" />
                          <button 
                            type="button" 
                            onClick={() => updateParticipant('signature_matin', '')}
                            className="remove-file"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="signature_soir">Signature Soir</label>
                <div className="signature-upload-container">
                  <select 
                    className="format-selector"
                    onChange={(e) => setSignatureFormat('soir', e.target.value)}
                    value={getSignatureFormat('soir')}
                  >
                    <option value="url">URL externe</option>
                    <option value="base64">Base64</option>
                    <option value="file">Fichier local</option>
                  </select>
                  
                  {getSignatureFormat('soir') === 'url' && (
                    <input
                      type="url"
                      placeholder="https://example.com/signature2.png"
                      value={formState.participant.signature_soir}
                      onChange={(e) => updateParticipant('signature_soir', e.target.value)}
                      className="signature-input"
                    />
                  )}
                  
                  {getSignatureFormat('soir') === 'base64' && (
                    <textarea
                      placeholder="data:image/png;base64,iVBORw0KGgo... ou base64 pur (PNG, JPEG, SVG)"
                      value={formState.participant.signature_soir}
                      onChange={(e) => updateParticipant('signature_soir', e.target.value)}
                      rows={3}
                      className="signature-input"
                    />
                  )}
                  
                  {getSignatureFormat('soir') === 'file' && (
                    <div className="file-upload-container">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload('soir', e.target.files?.[0])}
                        className="file-input"
                        id="file-soir"
                      />
                      <label htmlFor="file-soir" className="file-upload-label">
                        <i className="fas fa-upload"></i>
                        Choisir un fichier image
                      </label>
                      {formState.participant.signature_soir && (
                        <div className="file-preview">
                          <img src={formState.participant.signature_soir} alt="Aperçu" />
                          <button 
                            type="button" 
                            onClick={() => updateParticipant('signature_soir', '')}
                            className="remove-file"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
              </div>
              <div className="wizard-nav">
                <Button variant="primary" onClick={nextStep}>Étape suivante</Button>
              </div>
              </>
              )}

              {activeStep === 2 && (
              <>
              <div className="form-section">
            <div className="section-header">
              <h2><i className="fas fa-users"></i> Intervenants</h2>
              <Button onClick={addIntervenant} variant="secondary" icon="fas fa-plus">
                Ajouter un intervenant
              </Button>
            </div>
            <div id="intervenants-container">
              {formState.intervenants.length === 0 ? (
                <div className="empty-state">
                  <p>Aucun intervenant ajouté. Cliquez sur "Ajouter un intervenant" pour commencer.</p>
                </div>
              ) : (
                formState.intervenants.map((intervenant) => (
                  <div key={intervenant.id} className="intervenant-card">
                    <div className="intervenant-header">
                      <span className="intervenant-title">Intervenant {intervenant.id}</span>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeIntervenant(intervenant.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Nom</label>
                        <input
                          type="text"
                          placeholder="Nom de l'intervenant"
                          value={intervenant.nom}
                          onChange={(e) => updateIntervenant(intervenant.id, 'nom', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Prénom</label>
                        <input
                          type="text"
                          placeholder="Prénom de l'intervenant"
                          value={intervenant.prenom}
                          onChange={(e) => updateIntervenant(intervenant.id, 'prenom', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Signature Matin</label>
                        <div className="signature-upload-container">
                          <select 
                            className="format-selector"
                            onChange={(e) => setIntervenantSignatureFormat(intervenant.id, 'matin', e.target.value)}
                            value={getIntervenantSignatureFormat(intervenant.id, 'matin')}
                          >
                            <option value="url">URL externe</option>
                            <option value="base64">Base64</option>
                            <option value="file">Fichier local</option>
                          </select>
                          
                          {getIntervenantSignatureFormat(intervenant.id, 'matin') === 'url' && (
                            <input
                              type="url"
                              placeholder="https://example.com/signature.png"
                              value={intervenant.signature_matin}
                              onChange={(e) => updateIntervenant(intervenant.id, 'signature_matin', e.target.value)}
                              className="signature-input"
                            />
                          )}
                          
                          {getIntervenantSignatureFormat(intervenant.id, 'matin') === 'base64' && (
                            <textarea
                              placeholder="data:image/png;base64,iVBORw0KGgo... ou base64 pur (PNG, JPEG, SVG)"
                              value={intervenant.signature_matin}
                              onChange={(e) => updateIntervenant(intervenant.id, 'signature_matin', e.target.value)}
                              rows={3}
                              className="signature-input"
                            />
                          )}
                          
                          {getIntervenantSignatureFormat(intervenant.id, 'matin') === 'file' && (
                            <div className="file-upload-container">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleIntervenantFileUpload(intervenant.id, 'matin', e.target.files?.[0])}
                                className="file-input"
                                id={`file-matin-${intervenant.id}`}
                              />
                              <label htmlFor={`file-matin-${intervenant.id}`} className="file-upload-label">
                                <i className="fas fa-upload"></i>
                                Choisir un fichier image
                              </label>
                              {intervenant.signature_matin && (
                                <div className="file-preview">
                                  <img src={intervenant.signature_matin} alt="Aperçu" />
                                  <button 
                                    type="button" 
                                    onClick={() => updateIntervenant(intervenant.id, 'signature_matin', '')}
                                    className="remove-file"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Signature Soir</label>
                        <div className="signature-upload-container">
                          <select 
                            className="format-selector"
                            onChange={(e) => setIntervenantSignatureFormat(intervenant.id, 'soir', e.target.value)}
                            value={getIntervenantSignatureFormat(intervenant.id, 'soir')}
                          >
                            <option value="url">URL externe</option>
                            <option value="base64">Base64</option>
                            <option value="file">Fichier local</option>
                          </select>
                          
                          {getIntervenantSignatureFormat(intervenant.id, 'soir') === 'url' && (
                            <input
                              type="url"
                              placeholder="https://example.com/signature.png"
                              value={intervenant.signature_soir}
                              onChange={(e) => updateIntervenant(intervenant.id, 'signature_soir', e.target.value)}
                              className="signature-input"
                            />
                          )}
                          
                          {getIntervenantSignatureFormat(intervenant.id, 'soir') === 'base64' && (
                            <textarea
                              placeholder="data:image/png;base64,iVBORw0KGgo... ou base64 pur (PNG, JPEG, SVG)"
                              value={intervenant.signature_soir}
                              onChange={(e) => updateIntervenant(intervenant.id, 'signature_soir', e.target.value)}
                              rows={3}
                              className="signature-input"
                            />
                          )}
                          
                          {getIntervenantSignatureFormat(intervenant.id, 'soir') === 'file' && (
                            <div className="file-upload-container">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleIntervenantFileUpload(intervenant.id, 'soir', e.target.files?.[0])}
                                className="file-input"
                                id={`file-soir-${intervenant.id}`}
                              />
                              <label htmlFor={`file-soir-${intervenant.id}`} className="file-upload-label">
                                <i className="fas fa-upload"></i>
                                Choisir un fichier image
                              </label>
                              {intervenant.signature_soir && (
                                <div className="file-preview">
                                  <img src={intervenant.signature_soir} alt="Aperçu" />
                                  <button 
                                    type="button" 
                                    onClick={() => updateIntervenant(intervenant.id, 'signature_soir', '')}
                                    className="remove-file"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
              </div>
              <div className="wizard-nav">
                <Button variant="outline" onClick={prevStep}>Étape précédente</Button>
                <Button variant="primary" onClick={nextStep}>Étape suivante</Button>
              </div>
              </>
              )}

              {activeStep === 3 && (
              <>
              <div className="form-section">
            <h2><i className="fas fa-cog"></i> Configuration API</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="api_url">URL de l'API</label>
                <input
                  type="url"
                  id="api_url"
                  value={formState.apiConfig.url}
                  onChange={(e) => updateApiConfig('url', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="api_key">Clé API</label>
                <input
                  type="password"
                  id="api_key"
                  value={formState.apiConfig.key}
                  onChange={(e) => updateApiConfig('key', e.target.value)}
                  placeholder="Votre clé API"
                  required
                />
              </div>
            </div>
              </div>
              <div className="wizard-nav">
                <Button variant="outline" onClick={prevStep}>Étape précédente</Button>
                <Button variant="primary" onClick={nextStep}>Étape suivante</Button>
              </div>
              </>
              )}

              {activeStep === 4 && (
              <>
                <h2><i className="fas fa-eye"></i> Aperçu</h2>
                <p className="subtitle">Vérifiez vos données puis lancez la génération.</p>
                <div className="actions">
                  <Button onClick={() => setShowJsonPreview(true)} variant="outline" icon="fas fa-code">Voir JSON</Button>
                  <Button onClick={generatePdf} disabled={isLoading} icon="fas fa-file-pdf">Générer le PDF</Button>
                  <Button onClick={testApi} variant="secondary" disabled={isLoading} icon="fas fa-vial">Test API</Button>
                  <Button onClick={exportJson} variant="outline" icon="fas fa-download">Exporter JSON</Button>
                </div>
                <hr className="section-divider" />
                <div className="json-collapsible">
                  <details>
                    <summary>Aperçu JSON (réduit)</summary>
                    <div className="json-preview"><pre>{JSON.stringify(buildPreviewData(), null, 2)}</pre></div>
                  </details>
                </div>
                <div className="wizard-nav">
                  <Button variant="outline" onClick={prevStep}>Étape précédente</Button>
                </div>
              </>
              )}
            </div>
          </section>
        </div>
      </main>

      {showJsonPreview && (
        <div className="modal-overlay" onClick={() => setShowJsonPreview(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Aperçu JSON</h3>
              <button className="modal-close" onClick={() => setShowJsonPreview(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <pre>{JSON.stringify(buildPreviewData(), null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Génération du PDF en cours...</p>
          </div>
        </div>
      )}
      
      {notifications.map(notification => (
        <div key={notification.id} className={`notification ${notification.type}`}>
          <div className="notification-content">
            <i className={`notification-icon fas fa-${
              notification.type === 'success' ? 'check-circle' :
              notification.type === 'error' ? 'exclamation-circle' :
              notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'
            }`}></i>
            <span className="notification-message">{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => setNotifications(prev => 
                prev.filter(n => n.id !== notification.id)
              )}
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default App; 